"use client";

import type { SankeyLink, SankeyNode } from "d3-sankey";
import { createPortal } from "react-dom";
import {
  type SankeyLinkDatum,
  type SankeyNodeDatum,
  useSankey,
} from "./sankey-context";

// Helper to get node name from link source/target
type NodeOrIndex = SankeyNode<SankeyNodeDatum, SankeyLinkDatum> | number;

function getNodeName(nodeOrIndex: NodeOrIndex, fallbackIndex: number): string {
  if (typeof nodeOrIndex === "number") {
    return `Node ${nodeOrIndex}`;
  }
  return nodeOrIndex.name ?? `Node ${fallbackIndex}`;
}

export interface SankeyTooltipProps {
  /** Custom content renderer for node tooltips */
  nodeContent?: (props: {
    node: SankeyNode<SankeyNodeDatum, SankeyLinkDatum>;
    index: number;
  }) => React.ReactNode;
  /** Custom content renderer for link tooltips */
  linkContent?: (props: {
    link: SankeyLink<SankeyNodeDatum, SankeyLinkDatum>;
    index: number;
  }) => React.ReactNode;
  /** Value formatter function */
  formatValue?: (value: number) => string;
  /** Custom class name */
  className?: string;
}

function TooltipContainer({
  children,
  x,
  y,
  containerRef,
  containerWidth,
  containerHeight,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerWidth: number;
  containerHeight: number;
}) {
  if (!containerRef.current) return null;

  // Offset from cursor
  const offsetX = 12;
  const offsetY = -12;

  // Flip logic: if tooltip would go off-screen
  const flipX = x > containerWidth * 0.6;
  const flipY = y < containerHeight * 0.3;

  const style: React.CSSProperties = {
    position: "absolute",
    left: flipX ? undefined : x + offsetX,
    right: flipX ? containerWidth - x + offsetX : undefined,
    top: flipY ? y + Math.abs(offsetY) + 20 : undefined,
    bottom: flipY ? undefined : containerHeight - y + Math.abs(offsetY),
    zIndex: 50,
    pointerEvents: "none",
  };

  return createPortal(
    <div style={style}>{children}</div>,
    containerRef.current
  );
}

export function SankeyTooltip({
  nodeContent,
  linkContent,
  formatValue = (v) => v.toLocaleString("id-ID"),
  className = "",
}: SankeyTooltipProps) {
  const {
    tooltipData,
    containerRef,
    width,
    height,
    margin,
    nodes,
    links,
    mousePos,
  } = useSankey();

  if (!tooltipData) {
    return null;
  }

  // Use mouse position if available
  const x = mousePos ? mousePos.x : tooltipData.x + margin.left;
  const y = mousePos ? mousePos.y : tooltipData.y + margin.top;

  // Render node tooltip
  if (tooltipData.type === "node" && tooltipData.nodeIndex !== undefined) {
    const node = nodes[tooltipData.nodeIndex];
    if (!node) {
      return null;
    }

    const totalValue = node.value ?? 0;

    // Custom content
    if (nodeContent) {
      return (
        <TooltipContainer
          containerHeight={height}
          containerRef={containerRef}
          containerWidth={width}
          x={x}
          y={y}
        >
          <div className={className}>{nodeContent({ node, index: tooltipData.nodeIndex })}</div>
        </TooltipContainer>
      );
    }

    // Default node tooltip
    return (
      <TooltipContainer
        containerHeight={height}
        containerRef={containerRef}
        containerWidth={width}
        x={x}
        y={y}
      >
        <div
          className={`rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg text-sm min-w-[180px] ${className}`}
        >
          <p className="font-semibold text-foreground mb-1.5">{node.name}</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Total Nilai:</span>
            <span className="font-medium text-foreground">
              {formatValue(totalValue)}
            </span>
          </div>
        </div>
      </TooltipContainer>
    );
  }

  // Render link tooltip
  if (tooltipData.type === "link" && tooltipData.linkIndex !== undefined) {
    const link = links[tooltipData.linkIndex];
    if (!link) {
      return null;
    }

    const sourceName = getNodeName(
      link.source as NodeOrIndex,
      tooltipData.linkIndex
    );
    const targetName = getNodeName(
      link.target as NodeOrIndex,
      tooltipData.linkIndex
    );

    // Custom content
    if (linkContent) {
      return (
        <TooltipContainer
          containerHeight={height}
          containerRef={containerRef}
          containerWidth={width}
          x={x}
          y={y}
        >
          <div className={className}>{linkContent({ link, index: tooltipData.linkIndex })}</div>
        </TooltipContainer>
      );
    }

    // Default link tooltip
    return (
      <TooltipContainer
        containerHeight={height}
        containerRef={containerRef}
        containerWidth={width}
        x={x}
        y={y}
      >
        <div
          className={`rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg text-sm min-w-[200px] ${className}`}
        >
          <p className="font-semibold text-foreground mb-1.5">
            {sourceName} → {targetName}
          </p>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Nilai Transaksi:</span>
              <span className="font-medium text-foreground">
                {formatValue(link.value)}
              </span>
            </div>
            {(link as any).jmlTransaksi != null && (
              <div className="flex justify-between gap-4">
                <span>Jumlah Transaksi:</span>
                <span className="font-medium text-foreground">
                  {Number((link as any).jmlTransaksi).toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>
        </div>
      </TooltipContainer>
    );
  }

  return null;
}

SankeyTooltip.displayName = "SankeyTooltip";

export default SankeyTooltip;
