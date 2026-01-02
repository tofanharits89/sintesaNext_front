import { NextRequest, NextResponse } from "next/server";

// Allow long-running RAG streaming calls (up to 180s)
export const maxDuration = 180;
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_BASE =
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    `http://localhost:${process.env.BACKEND_PORT || process.env.NEXT_PUBLIC_BACKEND_PORT || "88"}/api/v1`;

export async function POST(req: NextRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    try {
        const backendUrl = `${BACKEND_BASE.replace(/\/$/, "")}/rag/chat/stream`;
        const body = await req.text();

        // Forward headers, especially cookies & content-type
        const headers = new Headers();
        req.headers.forEach((value, key) => {
            if (key.toLowerCase() === "host") return;
            headers.set(key, value);
        });
        // Request SSE from backend
        headers.set("Accept", "text/event-stream");

        const resp = await fetch(backendUrl, {
            method: "POST",
            body,
            headers,
            credentials: "include",
            signal: controller.signal,
        });

        if (!resp.ok) {
            const text = await resp.text();
            return new NextResponse(text, {
                status: resp.status,
                headers: { "Content-Type": "text/plain" },
            });
        }

        // Create a TransformStream to pass events through immediately
        const { readable, writable } = new TransformStream();

        // Pipe the response body to our writable stream
        // This ensures each chunk is passed through as it arrives
        (async () => {
            const reader = resp.body?.getReader();
            const writer = writable.getWriter();

            if (!reader) {
                await writer.close();
                return;
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    await writer.write(value);
                }
            } catch (error) {
                console.error("[RAG Stream Proxy] Error:", error);
            } finally {
                try {
                    await writer.close();
                } catch {
                    // Ignore close errors
                }
                reader.releaseLock();
            }
        })();

        // Return the readable side of the transform stream
        return new Response(readable, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error: any) {
        clearTimeout(timeout);
        const message = error?.name === "AbortError"
            ? "RAG streaming request aborted after 180s"
            : error?.message || "Failed to proxy RAG streaming request";

        // Return SSE error format
        const errorData = JSON.stringify({ type: "error", message });
        return new NextResponse(`data: ${errorData}\n\n`, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
            },
        });
    } finally {
        clearTimeout(timeout);
    }
}
