import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Follow pnpm's symlink to find react-pdf's real location in the .pnpm store,
  // then resolve its sibling pdfjs-dist so API and Worker versions always match.
  // We avoid require.resolve() and import.meta.resolve() because Turbopack
  // rewrites both into numeric module IDs at build time.
  const symlinkedReactPdf = path.join(process.cwd(), "node_modules", "react-pdf");
  const realReactPdfRoot = await realpath(symlinkedReactPdf);
  const workerPath = path.resolve(
    realReactPdfRoot,
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
