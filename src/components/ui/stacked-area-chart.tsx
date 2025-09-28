"use client";

import React from "react";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Line,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SeriesSpec {
  dataKey: string;
  name: string;
  color: string; // used for stroke and fill (with opacity)
  stackId?: string | number; // optional: only series with the same stackId will stack
  // Optional label configuration
  showLabel?: boolean;
  labelPosition?: "top" | "insideTop" | "insideBottom" | "inside" | "right" | "left";
  labelFormatter?: (value: number, payload?: any) => string;
}

interface StackedAreaChartProps {
  data: Array<{
    name: string;
    [key: string]: number | string | null | undefined;
  }>;
  title: string;
  description?: string;
  series: SeriesSpec[];
  height?: number;
  formatValue?: (value: number) => string;
  // X-axis label styling/rotation
  xTickAngle?: number; // e.g. -45 for diagonal
  xTickFontSize?: number; // e.g. 11
  xAxisHeight?: number; // e.g. 80 to fit rotated labels
  showAllXTicks?: boolean; // interval={0}
  // Wrap X-axis labels into multiple lines (SVG tspans). Works best with xTickAngle=0.
  wrapXTicks?: boolean;
  // Maximum characters per line when wrapping ticks. Default 12.
  xTickMaxChars?: number;
  // Optional chart margin overrides
  chartMargin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  // Optional X-axis padding so the first/last category isn't clipped
  xAxisPadding?: { left?: number; right?: number };
  // Optional Y-axis width to avoid clipping of tick labels
  yAxisWidth?: number;
  // Optional Y-axis domain control, e.g., [0, 'dataMax']
  yDomain?: [number | 'auto' | 'dataMin', number | 'auto' | 'dataMax'];
  // Whether Y-axis can show decimal ticks
  yAllowDecimals?: boolean;
  // Hide Y-axis ticks and labels (saves space on the left)
  yHideTicks?: boolean;
  // Optional badge text shown to the right of title (e.g., "Top 5")
  badgeText?: string;
}

export function StackedAreaChartComponent({
  data,
  title,
  description,
  series,
  height = 320,
  formatValue = (value) => value.toLocaleString("id-ID"),
  xTickAngle = 0,
  xTickFontSize = 12,
  xAxisHeight,
  showAllXTicks = false,
  wrapXTicks = false,
  xTickMaxChars = 12,
  chartMargin,
  xAxisPadding,
  yAxisWidth,
  yDomain,
  yAllowDecimals = false,
  yHideTicks = false,
  badgeText,
}: StackedAreaChartProps) {
  // Custom tick renderer to wrap labels across multiple lines using <tspan>
  const WrappedTick = ({ x, y, payload }: any) => {
    const text = String(payload?.value ?? "");
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    const maxChars = Math.max(4, xTickMaxChars);
    for (const w of words) {
      if ((current + (current ? " " : "") + w).length <= maxChars) {
        current = current ? current + " " + w : w;
      } else {
        if (current) lines.push(current);
        // If a single word is longer than max, hard-split it
        if (w.length > maxChars) {
          for (let i = 0; i < w.length; i += maxChars) {
            const chunk = w.slice(i, i + maxChars);
            if (i === 0) lines.push(chunk);
            else lines.push(chunk);
          }
          current = "";
        } else {
          current = w;
        }
      }
    }
    if (current) lines.push(current);
    // Start rendering BELOW the axis line so labels don't collide with chart area
    const dyStart = 6;
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="#666"
        fontSize={xTickFontSize}
        dominantBaseline="hanging"
      >
        {lines.map((line, idx) => (
          <tspan key={idx} x={x} dy={idx === 0 ? dyStart : xTickFontSize * 1.1}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {badgeText ? <Badge variant="secondary" className="text-xs">{badgeText}</Badge> : null}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{
              top: chartMargin?.top ?? 12,
              right: chartMargin?.right ?? 16,
              left: chartMargin?.left ?? 12,
              bottom: chartMargin?.bottom ?? 12,
            }}
          >
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={xTickFontSize}
              tickLine={false}
              axisLine={false}
              angle={wrapXTicks ? 0 : xTickAngle}
              textAnchor={wrapXTicks ? "middle" : xTickAngle ? (xTickAngle < 0 ? "end" : "start") : "middle"}
              {...(showAllXTicks ? { interval: 0 as const } : {})}
              {...(xAxisHeight !== undefined ? { height: xAxisHeight } : {})}
              {...(wrapXTicks ? { tick: (props: any) => <WrappedTick {...props} /> } : {})}
              {...(xAxisPadding ? { padding: xAxisPadding } : {})}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              {...(yHideTicks ? { tick: false } : {})}
              tickFormatter={(value) => (typeof value === "number" ? formatValue(value) : `${value}`)}
              {...(!yHideTicks && yAxisWidth !== undefined ? { width: yAxisWidth } : {})}
              {...(yDomain ? { domain: yDomain } : {})}
              allowDecimals={yAllowDecimals}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  // Remove duplicates introduced by invisible label lines: if an item has name === dataKey
                  // and there exists another item with the same dataKey but a different (friendly) name, drop it.
                  const cleaned = payload.filter((entry: any, idx: number) => {
                    const dk = entry.dataKey;
                    if (!dk) return true;
                    const hasFriendly = payload.some((e: any, j: number) => j !== idx && e.dataKey === dk && e.name && e.name !== dk);
                    if (entry.name === dk && hasFriendly) return false;
                    return true;
                  });
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                        </div>
                        {cleaned.map((entry: any, index: number) => {
                          const rawVal = entry.value as number;
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-sm font-medium">
                                {entry.name}: {formatValue(typeof rawVal === "number" ? rawVal : Number(rawVal))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {series.map((s, idx) => (
              <Area
                key={idx}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.25}
                {...(s.stackId !== undefined ? { stackId: s.stackId } : {})}
                strokeWidth={2}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls
              >
                {/* Labels are rendered via an invisible Line below to avoid duplication and improve positioning */}
              </Area>
            ))}
            {/* Overlay invisible lines solely for label positioning reliability */}
            {series.filter((s) => s.showLabel).map((s, idx) => (
              <Line
                key={`label-line-${idx}`}
                type="monotone"
                dataKey={s.dataKey}
                stroke="rgba(0,0,0,0.001)"
                strokeWidth={1}
                dot={{ r: 0.1, stroke: 'transparent', fill: 'transparent' }}
                connectNulls
                isAnimationActive={false}
          
              >
                <LabelList
                  dataKey={s.dataKey}
                  position={s.labelPosition ?? "top"}
                  offset={6}
                  content={(props: any) => {
                    const { x, y, value, payload } = props;
                    const v = typeof value === "number" ? value : Number(value);
                    if (!isFinite(v) || v <= 0) return null;
                    const text = s.labelFormatter ? s.labelFormatter(v, payload) : String(v);
                    const dy = -8;
                    return (
                      <text x={x} y={(y ?? 0) + dy} textAnchor="middle" fill="#111827" fontSize={12} fontWeight={700}>
                        {text}
                      </text>
                    );
                  }}
                />
              </Line>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
