"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderChartCard({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[240px] rounded-md border border-dashed grid place-items-center text-muted-foreground text-sm">
          Placeholder Chart
        </div>
      </CardContent>
    </Card>
  );
}

