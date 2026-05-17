import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Construct path manually — require.resolve() gets transformed by webpack/Turbopack
  // into a numeric module ID, which breaks path.dirname().
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "build",
    "pdf.worker.min.mjs",
  );

  const worker = await readFile(workerPath);

  return new NextResponse(new Uint8Array(worker), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
