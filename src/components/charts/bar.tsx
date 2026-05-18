"use client";

import { motion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { chartCssVars, useChart } from "./chart-context";

export type BarLineCap = "round" | "butt" | number;
export type BarAnimationType = "grow" | "fade";

export interface BarProps {
  /** Key in data to use for y values */
  dataKey: string;
  /** Fill color for the bar. Can be a color, gradient url, or pattern url. Default: var(--chart-line-primary) */
  fill?: string;
  /** Color for tooltip dot. Use when fill is a gradient/pattern. Default: uses fill value */
  stroke?: string;
  /** Line cap style for bar ends: "round", "butt", or a number for custom radius. Default: "round" */
  lineCap?: BarLineCap;
  /** Whether to animate the bars. Default: true */
  animate?: boolean;
  /** Animation type: "grow" (height) or "fade" (opacity + blur). Default: "grow" */
  animationType?: BarAnimationType;
  /** Opacity when not hovered (when another bar is hovered). Default: 0.3 */
  fadedOpacity?: number;
  /** Stagger delay between bars in seconds. Auto-calculated if not provided. */
  staggerDelay?: number;
  /** Gap between stacked bars in pixels. Default: 0 */
  stackGap?: number;
  /** Gap between grouped bars in pixels. Default: 4 */
  groupGap?: number;
  /** Minimum height/width in pixels for values > 0. Default: 0 */
  minPointSize?: number;
  /** Whether to show data labels inside the bar. Default: false */
  showLabels?: boolean;
  /** Custom formatter for data labels */
  labelFormatter?: (value: number) => string;
  /** Additional class name for data labels */
  labelClassName?: string;
  /** Custom color for data labels */
  labelColor?: string | undefined;
}

// Same easing as Line chart for consistent animation feel
const BAR_EASING = "cubic-bezier(0.85, 0, 0.15, 1)";

interface AnimatedBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx: number;
  ry: number;
  index: number;
  isFaded: boolean;
  animationType: BarAnimationType;
  innerHeight: number;
  fadedOpacity: number;
  staggerDelay: number;
  animationDuration: number;
  isHorizontal: boolean;
}

function AnimatedBar({
  x,
  y,
  width,
  height,
  fill,
  rx,
  ry,
  index,
  isFaded,
  animationType,
  innerHeight,
  fadedOpacity,
  staggerDelay,
  animationDuration,
  isHorizontal,
}: AnimatedBarProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger animation after stagger delay
  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setIsAnimated(true);
      },
      index * staggerDelay * 1000
    );
    return () => clearTimeout(timeout);
  }, [index, staggerDelay]);

  // Calculate the duration for this bar's animation
  // Each bar gets a proportional share of the remaining time
  const barDuration = animationDuration * 0.6; // 60% of total duration for the animation itself

  // Calculate opacity for fade animation (avoid nested ternary)
  const getFadeOpacity = () => {
    if (isFaded) {
      return fadedOpacity;
    }
    return isAnimated ? 1 : 0;
  };

  if (animationType === "fade") {
    return (
      <motion.rect
        animate={{
          opacity: getFadeOpacity(),
          filter: isAnimated ? "blur(0px)" : "blur(2px)",
        }}
        fill={fill}
        height={height}
        initial={{ opacity: 0, filter: "blur(2px)" }}
        rx={rx}
        ry={ry}
        style={{
          transition: `opacity ${barDuration}ms ${BAR_EASING}, filter ${barDuration}ms ${BAR_EASING}`,
        }}
        transition={{
          opacity: { duration: 0.15 },
        }}
        width={width}
        x={x}
        y={y}
      />
    );
  }

  // "grow" animation - bars grow from origin using CSS transitions
  const animatedProps = isHorizontal
    ? {
        width: isAnimated ? width : 0,
        height,
        x: 0,
        y,
      }
    : {
        width,
        height: isAnimated ? height : 0,
        x,
        y: isAnimated ? y : innerHeight,
      };

  return (
    <motion.rect
      animate={{
        opacity: isFaded ? fadedOpacity : 1,
      }}
      fill={fill}
      height={animatedProps.height}
      initial={{ opacity: 0 }}
      rx={rx}
      ry={ry}
      style={{
        transition: `width ${barDuration}ms ${BAR_EASING}, height ${barDuration}ms ${BAR_EASING}, x ${barDuration}ms ${BAR_EASING}, y ${barDuration}ms ${BAR_EASING}`,
      }}
      transition={{
        opacity: { duration: 0.15 },
      }}
      width={animatedProps.width}
      x={animatedProps.x}
      y={animatedProps.y}
    />
  );
}

export function Bar({
  dataKey,
  fill = chartCssVars.linePrimary,
  lineCap = "round",
  animate = true,
  animationType = "grow",
  fadedOpacity = 0.3,
  staggerDelay,
  stackGap = 0,
  groupGap = 4,
  minPointSize = 0,
  showLabels = false,
  labelFormatter,
  labelClassName,
  labelColor = "white",
}: BarProps) {
  const {
    data,
    yScale,
    innerHeight,
    isLoaded,
    barScale,
    bandWidth,
    hoveredBarIndex,
    setHoveredBarIndex,
    barXAccessor,
    lines,
    orientation,
    stacked,
    stackOffsets,
    animationDuration,
  } = useChart();

  // Calculate stagger delay automatically if not provided
  // Total animation duration is ~1200ms, with 40% for stagger spread and 60% for bar animation
  const totalAnimDuration = animationDuration || 1100;
  const staggerSpread = totalAnimDuration * 0.4; // 40% of time for stagger spread
  const calculatedStaggerDelay =
    staggerDelay ?? (data.length > 1 ? staggerSpread / 1000 / data.length : 0);
  const uniqueId = useId();

  const isHorizontal = orientation === "horizontal";

  // Filter lines to only include those intended for bar layout
  const barLines = useMemo(() => {
    return lines.filter((l) => l.type === "bar" || l.type === undefined);
  }, [lines]);

  // Find the index of this bar series among all bar series
  const seriesIndex = useMemo(() => {
    const idx = barLines.findIndex((l) => l.dataKey === dataKey);
    return idx >= 0 ? idx : 0;
  }, [barLines, dataKey]);

  const seriesCount = barLines.length;
  const isLastSeries = seriesIndex === seriesCount - 1;

  // Calculate the width for each bar within a group (for non-stacked)
  const barWidth = useMemo(() => {
    if (!bandWidth || seriesCount === 0) {
      return 0;
    }
    if (stacked) {
      // Stacked bars use full band width
      return bandWidth;
    }
    // Leave a gap between grouped bars (controlled by groupGap prop)
    const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
    return (bandWidth - effectiveGroupGap * (seriesCount - 1)) / seriesCount;
  }, [bandWidth, seriesCount, stacked, groupGap]);

  // Calculate corner radius based on lineCap
  const cornerRadius = useMemo(() => {
    if (typeof lineCap === "number") {
      return lineCap;
    }
    if (lineCap === "round" && barWidth) {
      return Math.min(barWidth / 2, 8);
    }
    return 0;
  }, [lineCap, barWidth]);

  // Early return if bar scale not available (not in BarChart)
  if (!(barScale && bandWidth && barXAccessor)) {
    console.warn("Bar component must be used within a BarChart");
    return null;
  }

  return (
    <g className={`bar-series-${uniqueId}`}>
      {data.map((d, i) => {
        const value = d[dataKey];
        if (typeof value !== "number") {
          return null;
        }

        const bandPos = barScale(String(i)) ?? 0;

        let x: number;
        let y: number;
        let barHeight: number;
        let barW: number;

        if (isHorizontal) {
          barHeight = barWidth;
          if (stacked) {
            let currentLeft = 0;
            let finalX = 0;
            let finalWidth = 0;
            
            for (let sIdx = 0; sIdx <= seriesIndex; sIdx++) {
              const line = lines[sIdx];
              if (!line) continue;
              const val = d[line.dataKey];
              if (typeof val !== "number") continue;
              
              const valPos = yScale(val) ?? 0;
              let bw = valPos;
              const isLast = sIdx === seriesCount - 1;
              
              if (!isLast && stackGap > 0) {
                bw = Math.max(0, bw - stackGap);
              }
              if (val > 0 && bw < minPointSize) {
                bw = minPointSize;
              }
              
              if (sIdx === seriesIndex) {
                finalX = currentLeft;
                finalWidth = bw;
              }
              currentLeft = currentLeft + bw + stackGap;
            }
            
            x = finalX;
            barW = finalWidth;
            y = bandPos;
          } else {
            const valuePos = yScale(value) ?? 0;
            barW = valuePos;
            x = 0;
            if (value > 0 && barW < minPointSize) {
              barW = minPointSize;
            }
            const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
            y = bandPos + seriesIndex * (barWidth + effectiveGroupGap);
          }
        } else {
          barW = barWidth;
          if (stacked) {
            let currentBottom = innerHeight;
            let finalY = 0;
            let finalHeight = 0;
            
            for (let sIdx = 0; sIdx <= seriesIndex; sIdx++) {
              const line = lines[sIdx];
              if (!line) continue;
              const val = d[line.dataKey];
              if (typeof val !== "number") continue;
              
              const valPos = yScale(val) ?? 0;
              let bh = innerHeight - valPos;
              const isLast = sIdx === seriesCount - 1;
              
              if (!isLast && stackGap > 0) {
                bh = Math.max(0, bh - stackGap);
              }
              if (val > 0 && bh < minPointSize) {
                bh = minPointSize;
              }
              
              if (sIdx === seriesIndex) {
                finalY = currentBottom - bh;
                finalHeight = bh;
              }
              currentBottom = currentBottom - bh - stackGap;
            }
            
            y = finalY;
            barHeight = finalHeight;
            x = bandPos;
          } else {
            const valuePos = yScale(value) ?? 0;
            barHeight = innerHeight - valuePos;
            if (value > 0 && barHeight < minPointSize) {
              barHeight = minPointSize;
            }
            y = innerHeight - barHeight;
            const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
            x = bandPos + seriesIndex * (barWidth + effectiveGroupGap);
          }
        }

        const isFaded = hoveredBarIndex !== null && hoveredBarIndex !== i;

        // Use index in key to ensure uniqueness even if names (categoryValue) are duplicated
        const categoryValue = barXAccessor(d);
        const barKey = `bar-${dataKey}-${categoryValue}-${i}`;

        // Data label logic
        const formattedValue = showLabels && typeof value === "number" && value > 0
          ? (labelFormatter ? labelFormatter(value) : value.toLocaleString("id-ID"))
          : null;
        
        // Only show label if the bar is large enough to contain it reasonably
        const showLabel = !!formattedValue && (isHorizontal ? barW > 30 : barHeight > 14);

        // Apply rounded corners:
        // - For non-stacked: always apply
        // - For stacked with gap: apply to all bars
        // - For stacked without gap: only apply to the last series
        const applyRounding = !stacked || stackGap > 0 || isLastSeries;
        const effectiveRx = applyRounding ? cornerRadius : 0;
        const effectiveRy = applyRounding ? cornerRadius : 0;

        if (animate && !isLoaded) {
          return (
            <AnimatedBar
              animationDuration={totalAnimDuration}
              animationType={animationType}
              fadedOpacity={fadedOpacity}
              fill={fill}
              height={barHeight}
              index={i}
              innerHeight={innerHeight}
              isFaded={isFaded}
              isHorizontal={isHorizontal}
              key={barKey}
              rx={effectiveRx}
              ry={effectiveRy}
              staggerDelay={calculatedStaggerDelay}
              width={barW}
              x={x}
              y={y}
            />
          );
        }

        // Static bar after animation completes
        return (
          <g key={barKey}>
            <motion.rect
              animate={{
                opacity: isFaded ? fadedOpacity : 1,
              }}
              fill={fill}
              height={barHeight}
              initial={false}
              onMouseEnter={() => setHoveredBarIndex?.(i)}
              onMouseLeave={() => setHoveredBarIndex?.(null)}
              rx={effectiveRx}
              ry={effectiveRy}
              style={{
                cursor: "pointer",
              }}
              transition={{
                opacity: { duration: 0.15 },
              }}
              width={barW}
              x={x}
              y={y}
            />
            {showLabel && (
              <motion.text
                animate={{
                  opacity: isFaded ? fadedOpacity : 1,
                }}
                className={cn(
                  "pointer-events-none select-none text-[8px] font-mono",
                  labelClassName
                )}
                initial={{ opacity: 0 }}
                style={{
                  fill: labelColor,
                  transition: `opacity 0.2s ${BAR_EASING}`,
                  textAnchor: "middle",
                  dominantBaseline: "middle",
                }}
                x={x + barW / 2}
                y={y + barHeight / 2}
              >
                {formattedValue}
              </motion.text>
            )}
          </g>
        );
      })}
    </g>
  );
}

Bar.displayName = "Bar";

export default Bar;
