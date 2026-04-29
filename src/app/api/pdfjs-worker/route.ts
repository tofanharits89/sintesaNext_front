import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const require = createRequire(import.meta.url);
  const reactPdfPackagePath = require.resolve("react-pdf/package.json");
  const reactPdfRoot = path.dirname(reactPdfPackagePath);
  const workerPath = path.resolve(
    reactPdfRoot,
    "../pdfjs-dist/build/pdf.worker.min.mjs",
  );

  const worker = await readFile(workerPath);

  return new NextResponse(new Uint8Array(worker), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
