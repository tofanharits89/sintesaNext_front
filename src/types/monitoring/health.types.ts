export interface HealthIssue {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  component?: string;
}

export interface HealthApiResponse {
  status: 'healthy' | 'warning' | 'critical';
  hit_rate: number;
  average_query_time: number;
  issues: HealthIssue[];
  uptime: number;
  version: string;
}

export interface PerformanceInsight {
  type: 'excellent' | 'good' | 'warning' | 'critical';
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
}
