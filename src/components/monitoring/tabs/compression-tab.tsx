import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import type { PerformanceMetrics } from "@/types/monitoring";
import { getCompressionSavings, formatPercentage, formatNumber, formatResponseTime } from "@/utils/monitoring";

interface CompressionTabProps {
  metrics: PerformanceMetrics;
}

export const CompressionTab = ({ metrics }: CompressionTabProps) => {
  const { compressionStats } = metrics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Compression Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  {getCompressionSavings(compressionStats)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Compression Time</p>
                <p className="text-2xl font-bold">{formatResponseTime(compressionStats.averageCompressionTime)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compression Ratio</span>
                <span className="font-medium">{formatPercentage(compressionStats.compressionRatio)}</span>
              </div>
              <Progress value={compressionStats.compressionRatio * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Algorithm Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Brotli</span>
                  <span className="font-medium">{formatPercentage(compressionStats.brotliUsage)}</span>
                </div>
                <Progress value={compressionStats.brotliUsage * 100} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Gzip (Fallback)</span>
                  <span className="font-medium">{formatPercentage(compressionStats.gzipUsage)}</span>
                </div>
                <Progress value={compressionStats.gzipUsage * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
