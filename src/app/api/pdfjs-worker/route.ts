import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Resolve the worker from react-pdf's own pdfjs-dist dependency so the API
  // and Worker versions always match.  We avoid require.resolve() because
  // webpack/Turbopack rewrites it into a numeric module ID at build time.
  // import.meta.resolve() is a Node runtime API that bundlers leave untouched.
  const reactPdfPkg = fileURLToPath(import.meta.resolve("react-pdf/package.json"));
  const reactPdfRoot = path.dirname(reactPdfPkg);          // …/node_modules/react-pdf
  const workerPath = path.resolve(
    reactPdfRoot,
    "../pdfjs-dist/build/pdf.worker.min.mjs",              // sibling in pnpm store
  );

  const worker = await readFile(workerPath);

  return new NextResponse(new Uint8Array(worker), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
