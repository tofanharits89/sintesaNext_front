import TrendMBGLanding from "@/components/mbg/trend-mbg/landing";

export default function TrendMBGPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Trend MBG</h1>
      <p className="text-sm text-muted-foreground">Trend Makan Bergizi.</p>

      <hr className="my-4 border-t border-gray-100" />

      <TrendMBGLanding />
    </div>
  );
}
