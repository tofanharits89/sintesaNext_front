"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { scaleLinear } from "@visx/scale";
import { chartCssVars, useChart } from "./chart-context";

export interface LineProps {
  /** Key in data to use for y values */
  dataKey: string;
  /** Stroke color for the line. Default: var(--chart-line-primary) */
  stroke?: string;
  /** Stroke width. Default: 2 */
  strokeWidth?: number;
  /** Custom Y-axis domain. Use this for dual-axis (e.g. [0, 100] for percentage) */
  yDomain?: [number, number];
  /** Whether to animate the line drawing. Default: true */
  animate?: boolean;
  /** Whether to show dots at data points. Default: true */
  showDots?: boolean;
  /** Size of the dots. Default: 4 */
  dotSize?: number;
}

const LINE_EASING = [0.4, 0, 0.2, 1] as const;

export function Line({
  dataKey,
  stroke = chartCssVars.linePrimary,
  strokeWidth = 2.5,
  yDomain,
  animate = true,
  showDots = true,
  dotSize = 6,
}: LineProps) {
  const {
    data,
    yScale: primaryYScale,
    innerHeight,
    barScale,
    bandWidth,
    hoveredBarIndex,
    animationDuration,
  } = useChart();

  // Create local Y scale if domain is provided (dual axis support)
  const yScale = useMemo(() => {
    if (!yDomain) return primaryYScale;
    return scaleLinear({
      range: [innerHeight, 0],
      domain: yDomain,
      nice: false,
    });
  }, [innerHeight, yDomain, primaryYScale]);

  // Calculate points for the path
  const points = useMemo(() => {
    return data
      .map((d, i) => {
        const val = d[dataKey];
        if (typeof val !== "number") return null;
        
        const x = (barScale!(String(i)) ?? 0) + (bandWidth ?? 0) / 2;
        const y = yScale(val) ?? 0;
        
        return { x, y, value: val, index: i };
      })
      .filter((p): p is { x: number; y: number; value: number; index: number } => p !== null);
  }, [data, dataKey, barScale, bandWidth, yScale]);

  // Generate SVG path string
  const pathData = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, "");
  }, [points]);

  if (!barScale || !bandWidth) {
    console.warn("Line component must be used within a BarChart or similar categorical provider");
    return null;
  }

  const duration = (animationDuration || 1100) / 1000;

  return (
    <g className={`chart-line-group-${dataKey}`}>
      {/* The Line Path */}
      {pathData && (
        <motion.path
          d={pathData}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))" }}
          initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration, ease: LINE_EASING },
            opacity: { duration: 0.2 }
          }}
        />
      )}

      {/* Points (Dots) */}
      {showDots && points.map((p) => {
        const isFaded = hoveredBarIndex !== null && hoveredBarIndex !== p.index;
        
        return (
          <motion.circle
            key={`dot-${dataKey}-${p.index}`}
            cx={p.x}
            cy={p.y}
            r={dotSize}
            fill={stroke}
            stroke="white"
            strokeWidth={2.5}
            style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))" }}
            initial={animate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ 
              scale: isFaded ? 0.8 : 1, 
              opacity: isFaded ? 0.5 : 1 
            }}
            transition={{
              scale: { type: "spring", stiffness: 300, damping: 20 },
              opacity: { duration: 0.2 }
            }}
          />
        );
      })}
    </g>
  );
}

Line.displayName = "Line";

export default Line;
