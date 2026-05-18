"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BoundedWordCloudItem {
  color: string;
  text: string;
  tooltip: string;
  value: number;
}

interface BoundedWordCloudProps {
  height?: number;
  items: BoundedWordCloudItem[];
  maxFontSize: number;
  maxVisible?: number;
  minFontSize: number;
}

const WORD_FONT =
  'Belanosima, ui-rounded, "Arial Rounded MT Bold", var(--font-geist-sans), system-ui, sans-serif';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) % 10000) / 10000;
  };
}

function getWordSize(
  value: number,
  minValue: number,
  maxValue: number,
  rank: number,
  total: number,
  minFontSize: number,
  maxFontSize: number,
) {
  if (maxValue === minValue) {
    const rankWeight = total <= 1 ? 1 : 1 - rank / (total - 1);
    return minFontSize + rankWeight * (maxFontSize - minFontSize);
  }

  const valueWeight = (value - minValue) / (maxValue - minValue);
  const rankWeight = total <= 1 ? 1 : 1 - rank / (total - 1);
  const weight = Math.max(valueWeight, rankWeight * 0.85);

  return minFontSize + Math.pow(weight, 0.62) * (maxFontSize - minFontSize);
}

function wrapTwoLines(text: string, fontSize: number, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];

  const charWidth = fontSize * 0.68;
  const lineFits = (line: string) => line.length * charWidth <= maxWidth;
  const fullText = words.join(" ");
  if (lineFits(fullText)) return [fullText];

  let bestSplit = Math.ceil(words.length / 2);
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(" ");
    const line2 = words.slice(i).join(" ");
    const overflow =
      Math.max(0, line1.length * charWidth - maxWidth) +
      Math.max(0, line2.length * charWidth - maxWidth);
    const balance = Math.abs(line1.length - line2.length);
    const score = overflow * 10 + balance;
    if (score < bestScore) {
      bestScore = score;
      bestSplit = i;
    }
  }

  return [
    words.slice(0, bestSplit).join(" "),
    words.slice(bestSplit).join(" "),
  ];
}

function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap: number,
) {
  return !(
    a.x + a.width + gap < b.x ||
    b.x + b.width + gap < a.x ||
    a.y + a.height + gap < b.y ||
    b.y + b.height + gap < a.y
  );
}

export function BoundedWordCloud({
  height = 360,
  items,
  maxFontSize,
  maxVisible = 32,
  minFontSize,
}: BoundedWordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry?.contentRect.width ?? 0);
      if (nextWidth > 0) setWidth(nextWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const placedWords = useMemo(() => {
    if (!width || items.length === 0) return [];

    const padding = 24;
    const innerWidth = Math.max(0, width - padding * 2);
    const innerHeight = Math.max(0, height - padding * 2);
    const sorted = [...items]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxVisible);
    const values = sorted.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const seed = hashString(
      sorted.map((item) => `${item.text}:${item.value}`).join("|"),
    );
    const random = createRandom(seed);
    const placed: Array<{
      color: string;
      fontSize: number;
      height: number;
      lines: string[];
      renderX: number;
      renderY: number;
      text: string;
      tooltip: string;
      value: number;
      width: number;
      x: number;
      y: number;
    }> = [];

    sorted.forEach((item, index) => {
      const fontSize = getWordSize(
        item.value,
        minValue,
        maxValue,
        index,
        sorted.length,
        minFontSize,
        maxFontSize,
      );
      const maxWordWidth = clamp(
        innerWidth * (index < 4 ? 0.44 : 0.32),
        150,
        390,
      );
      const lines = wrapTwoLines(item.text, fontSize, maxWordWidth);
      const textWidth = Math.max(
        ...lines.map((line) => line.length * fontSize * 0.68),
      );
      const box = {
        width: Math.min(maxWordWidth, textWidth) + 12,
        height: lines.length * fontSize * 1.02 + 8,
      };

      if (box.width > innerWidth || box.height > innerHeight) return;

      let position: { x: number; y: number } | null = null;
      const gap = index < 4 ? 10 : 7;

      for (let attempt = 0; attempt < 260; attempt++) {
        const spread = attempt / 260;
        const centerBias = 1 - spread * 0.45;
        const rawX =
          (random() - 0.5) * innerWidth * centerBias + innerWidth / 2;
        const rawY =
          (random() - 0.5) * innerHeight * centerBias + innerHeight / 2;
        const x = clamp(rawX - box.width / 2, 0, innerWidth - box.width);
        const y = clamp(rawY - box.height / 2, 0, innerHeight - box.height);
        const candidate = { x, y, width: box.width, height: box.height };

        if (!placed.some((word) => intersects(candidate, word, gap))) {
          position = { x, y };
          break;
        }
      }

      if (!position) return;

      placed.push({
        color: item.color,
        fontSize,
        height: box.height,
        lines,
        renderX: position.x + padding,
        renderY: position.y + padding,
        text: item.text,
        tooltip: item.tooltip,
        value: item.value,
        width: box.width,
        x: position.x,
        y: position.y,
      });
    });

    return placed;
  }, [height, items, maxFontSize, maxVisible, minFontSize, width]);

  return (
    <div
      className="group relative w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-black"
      ref={containerRef}
      style={{ height }}
    >
      <TooltipProvider delayDuration={0}>
        {placedWords.map((word) => (
          <Tooltip key={word.text}>
            <TooltipTrigger asChild>
              <button
                className="absolute flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-center tracking-normal transition-[opacity,filter,transform] duration-200 group-hover:opacity-35 hover:z-10 hover:scale-105 hover:opacity-100 hover:drop-shadow-md"
                style={{
                  color: word.color,
                  fontFamily: WORD_FONT,
                  fontSize: `${word.fontSize}px`,
                  fontWeight: 600,
                  height: word.height,
                  left: word.renderX,
                  lineHeight: 0.9,
                  overflow: "hidden",
                  top: word.renderY,
                  width: word.width,
                }}
                type="button"
              >
                <span className="block max-w-full overflow-hidden">
                  {word.lines.map((line) => (
                    <span
                      className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                      key={line}
                    >
                      {line}
                    </span>
                  ))}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              className="pointer-events-none shadow-md"
              sideOffset={5}
            >
              <p className="text-sm font-medium">{word.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
