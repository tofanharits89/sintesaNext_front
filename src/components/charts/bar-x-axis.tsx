"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useChart } from "./chart-context";

export interface BarXAxisProps {
  /** Width of the date ticker box for fade calculation. Default: 50 */
  tickerHalfWidth?: number;
  /** Whether to show all labels or skip some for dense data. Default: false */
  showAllLabels?: boolean;
  /** Maximum number of labels to show. Default: 12 */
  maxLabels?: number;
}

interface BarXAxisLabelProps {
  label: string;
  x: number;
  crosshairX: number | null;
  isHovering: boolean;
  tickerHalfWidth: number;
  bandWidth: number;
}

function BarXAxisLabel({
  label,
  x,
  crosshairX,
  isHovering,
  tickerHalfWidth,
  bandWidth,
}: BarXAxisLabelProps) {
  const fadeBuffer = 20;
  const fadeRadius = tickerHalfWidth + fadeBuffer;

  let opacity = 1;
  if (isHovering && crosshairX !== null) {
    const distance = Math.abs(x - crosshairX);
    if (distance < tickerHalfWidth) {
      opacity = 0;
    } else if (distance < fadeRadius) {
      opacity = (distance - tickerHalfWidth) / fadeBuffer;
    }
  }

  return (
    <div
      className="absolute flex justify-center"
      style={{
        left: x,
        top: "calc(100% - 16px)",
        width: bandWidth,
        transform: "translateX(-50%)",
      }}
    >
      <motion.span
        animate={{ opacity }}
        className={cn("text-chart-label text-[9px] font-mono text-center line-clamp-3 leading-tight")}
        initial={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ width: "100%", wordWrap: "break-word" }}
      >
        {label}
      </motion.span>
    </div>
  );
}

export function BarXAxis({
  tickerHalfWidth = 50,
  showAllLabels = false,
  maxLabels = 12,
}: BarXAxisProps) {
  const {
    margin,
    tooltipData,
    containerRef,
    barScale,
    bandWidth,
    barXAccessor,
    data,
    height,
  } = useChart();
  const [mounted, setMounted] = useState(false);

  // Only render on client side after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate labels for each bar
  const labelsToShow = useMemo(() => {
    if (!(barScale && bandWidth && barXAccessor)) {
      return [];
    }

    const allLabels = data.map((d, i) => {
      const label = barXAccessor(d);
      const bandX = barScale(String(i)) ?? 0;
      // Center the label under the bar group
      const x = bandX + bandWidth / 2 + margin.left;
      return { label, x, key: `${label}-${i}` };
    });

    // If showAllLabels is true or we have fewer than maxLabels, show all
    if (showAllLabels || allLabels.length <= maxLabels) {
      return allLabels;
    }

    // Otherwise, skip some labels to avoid crowding
    const step = Math.ceil(allLabels.length / maxLabels);
    return allLabels.filter((_, i) => i % step === 0);
  }, [
    barScale,
    bandWidth,
    barXAccessor,
    data,
    margin.left,
    showAllLabels,
    maxLabels,
  ]);

  const isHovering = tooltipData !== null;
  const crosshairX = tooltipData ? tooltipData.x + margin.left : null;

  // Use portal to render into the chart container
  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  // Early return if not in a BarChart
  if (!barScale) {
    return null;
  }

  // Dynamic import to avoid SSR issues
  const { createPortal } = require("react-dom") as typeof import("react-dom");

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {labelsToShow.map((item) => (
        <BarXAxisLabel
          crosshairX={crosshairX}
          isHovering={isHovering}
          key={item.key}
          label={item.label}
          tickerHalfWidth={tickerHalfWidth}
          x={item.x}
          bandWidth={bandWidth ?? 0}
        />
      ))}
    </div>,
    container
  );
}

BarXAxis.displayName = "BarXAxis";

export default BarXAxis;
