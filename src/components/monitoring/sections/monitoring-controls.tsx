import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import type { 
  PerformanceMetrics, 
  TimeRange, 
  MonitoringControlsState 
} from "@/types/monitoring";
import { 
  getHealthStatusIcon,
  getHealthStatusIconColor,
  getHealthStatusBadgeColor 
} from "@/utils/monitoring";

interface MonitoringControlsProps {
  metrics: PerformanceMetrics | null;
  controls: MonitoringControlsState;
  lastUpdated: Date;
  loading: boolean;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  onRefresh: () => void;
  onAutoRefreshToggle: () => void;
}

const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
];

export const MonitoringControls = ({
  metrics,
  controls,
  lastUpdated,
  loading,
  onTimeRangeChange,
  onRefresh,
  onAutoRefreshToggle,
}: MonitoringControlsProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Select 
          value={controls.selectedTimeRange} 
          onValueChange={onTimeRangeChange}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={controls.isAutoRefresh}
            onCheckedChange={onAutoRefreshToggle}
          />
          <span className="text-sm text-muted-foreground">
            Auto-refresh ({controls.refreshInterval / 1000}s)
          </span>
        </div>
        
        {metrics && (
          <Badge className={getHealthStatusBadgeColor(metrics.healthStatus.status)}>
            {(() => {
              const IconComponent = getHealthStatusIcon(metrics.healthStatus.status);
              return <IconComponent className={`h-4 w-4 ${getHealthStatusIconColor(metrics.healthStatus.status)}`} />;
            })()}
            {metrics.healthStatus.status.toUpperCase()}
          </Badge>
        )}
        
        <span className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
