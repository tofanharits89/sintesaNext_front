import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { PerformanceMetrics } from "@/types/monitoring";
import { 
  getHealthStatusIcon,
  getHealthStatusIconColor,
  getHealthStatusColor, 
  getHealthStatusBadgeColor,
  formatPercentage 
} from "@/utils/monitoring";

interface HealthTabProps {
  metrics: PerformanceMetrics;
}

export const HealthTab = ({ metrics }: HealthTabProps) => {
  const { healthStatus } = metrics;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const IconComponent = getHealthStatusIcon(healthStatus.status);
              return <IconComponent className={`h-5 w-5 ${getHealthStatusIconColor(healthStatus.status)}`} />;
            })()}
            System Health Status
          </CardTitle>
          <CardDescription>
            Overall system health based on cache performance and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getHealthStatusBadgeColor(healthStatus.status)}>
              {(() => {
                const IconComponent = getHealthStatusIcon(healthStatus.status);
                return <IconComponent className={`h-4 w-4 ${getHealthStatusIconColor(healthStatus.status)}`} />;
              })()}
              {healthStatus.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Hit Rate: {formatPercentage(healthStatus.hitRate)} | 
              Avg Response: {Math.round(healthStatus.averageQueryTime)}ms
            </span>
          </div>
          
          {healthStatus.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Issues Detected:</h4>
              <ul className="space-y-1">
                {healthStatus.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {healthStatus.issues.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              All systems operating normally
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
