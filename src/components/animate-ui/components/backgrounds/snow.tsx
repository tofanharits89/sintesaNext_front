'use client';

import * as React from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from 'motion/react';

import { cn } from '../../../../lib/utils/utils';

// ──────────────────────────────────────────────
// Multiple SVG snowflake / ice-crystal variants
// ──────────────────────────────────────────────
const SNOWFLAKE_PATHS = [
  // Variant 1: Classic 6-arm snowflake
  `M50 10 L50 90 M10 50 L90 50
   M21.7 21.7 L78.3 78.3 M78.3 21.7 L21.7 78.3
   M50 10 L44 26 M50 10 L56 26
   M50 90 L44 74 M50 90 L56 74
   M10 50 L26 44 M10 50 L26 56
   M90 50 L74 44 M90 50 L74 56
   M21.7 21.7 L30 34 M21.7 21.7 L34 30
   M78.3 78.3 L70 66 M78.3 78.3 L66 70
   M78.3 21.7 L70 34 M78.3 21.7 L66 30
   M21.7 78.3 L30 66 M21.7 78.3 L34 70`,

  // Variant 2: More ornate branches
  `M50 5 L50 95 M5 50 L95 50
   M18.3 18.3 L81.7 81.7 M81.7 18.3 L18.3 81.7
   M50 5 L42 22 M50 5 L58 22
   M50 95 L42 78 M50 95 L58 78
   M5 50 L22 42 M5 50 L22 58
   M95 50 L78 42 M95 50 L78 58
   M18.3 18.3 L28 35 M18.3 18.3 L35 28
   M81.7 81.7 L72 65 M81.7 81.7 L65 72
   M81.7 18.3 L72 35 M81.7 18.3 L65 28
   M18.3 81.7 L28 65 M18.3 81.7 L35 72
   M50 5 L45 15 M50 5 L55 15
   M50 95 L45 85 M50 95 L55 85`,

  // Variant 3: Hexagonal ice crystal
  `M50 12 L50 88
   M20.4 31 L79.6 69
   M20.4 69 L79.6 31
   M50 12 L43 26 M50 12 L57 26
   M50 88 L43 74 M50 88 L57 74
   M20.4 31 L33 38 M20.4 31 L30 44
   M79.6 69 L67 62 M79.6 69 L70 56
   M20.4 69 L33 62 M20.4 69 L30 56
   M79.6 31 L67 38 M79.6 31 L70 44`,

  // Variant 4: Simpler delicate crystal
  `M50 15 L50 85 M15 50 L85 50
   M26.1 26.1 L73.9 73.9 M73.9 26.1 L26.1 73.9
   M50 15 L45 28 M50 15 L55 28
   M50 85 L45 72 M50 85 L55 72
   M15 50 L28 45 M15 50 L28 55
   M85 50 L72 45 M85 50 L72 55`,
];

// Ice-blue / white color palette
const ICE_COLORS_DARK = [
  'rgba(186, 230, 253, 0.8)',  // sky-200
  'rgba(147, 197, 253, 0.8)',  // blue-300
  'rgba(165, 243, 252, 0.8)',  // cyan-200
  'rgba(224, 242, 254, 0.9)',  // sky-100
  'rgba(255, 255, 255, 0.85)', // white
  'rgba(196, 218, 255, 0.8)',  // indigo-200
  'rgba(167, 243, 208, 0.7)',  // emerald-200 (frost)
];

const ICE_COLORS_LIGHT = [
  'rgba(59, 130, 246, 0.35)',  // blue-500
  'rgba(14, 165, 233, 0.30)',  // sky-500
  'rgba(6, 182, 212, 0.30)',   // cyan-500
  'rgba(99, 102, 241, 0.30)',  // indigo-500
  'rgba(30, 41, 59, 0.25)',    // slate-800
  'rgba(56, 189, 248, 0.35)',  // sky-400
  'rgba(125, 211, 252, 0.40)', // sky-300
];

interface SnowflakeItem {
  id: number;
  x: number;        // posisi horizontal (%)
  size: number;     // diameter px — variatif
  color: string;
  pathIndex: number;// index SVG variant
  duration: number; // durasi jatuh (s)
  delay: number;    // delay awal
  drift: number;    // horizontal drift px
  rotation: number; // initial rotation deg
  rotationSpeed: number; // deg per cycle
  opacity: number;
}

function generateSnowflakes(count: number, isDark: boolean): SnowflakeItem[] {
  const colors = isDark ? ICE_COLORS_DARK : ICE_COLORS_LIGHT;
  return Array.from({ length: count }).map((_, i) => {
    // Size distribution: kebanyakan kecil, sedikit yang besar
    const sizeRoll = Math.random();
    const size =
      sizeRoll < 0.5
        ? 14 + Math.random() * 20   // kecil: 14-34px
        : sizeRoll < 0.8
          ? 34 + Math.random() * 30  // sedang: 34-64px
          : 64 + Math.random() * 60; // besar: 64-124px

    return {
      id: i,
      x: Math.random() * 100,
      size,
      color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
      pathIndex: Math.floor(Math.random() * SNOWFLAKE_PATHS.length),
      duration: 10 + Math.random() * 20,
      delay: Math.random() * -30,
      drift: (Math.random() - 0.5) * 80,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 180,
      opacity: 0.5 + Math.random() * 0.5,
    };
  });
}

type SnowBackgroundProps = React.ComponentProps<'div'> & {
  count?: number;
  factor?: number;
  pointerEvents?: boolean;
  isDark?: boolean;
};

function SnowBackground({
  children,
  className,
  count = 35,
  factor = 0.04,
  pointerEvents = true,
  isDark = false,
  ...props
}: SnowBackgroundProps) {
  const [flakes, setFlakes] = React.useState<SnowflakeItem[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [height, setHeight] = React.useState(900);

  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const springOptions: SpringOptions = { stiffness: 40, damping: 20 };
  const springX = useSpring(offsetX, springOptions);
  const springY = useSpring(offsetY, springOptions);

  React.useEffect(() => {
    setMounted(true);
    setHeight(window.innerHeight);
    setFlakes(generateSnowflakes(count, isDark));
  }, [count, isDark]);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      offsetX.set(-(e.clientX - centerX) * factor);
      offsetY.set(-(e.clientY - centerY) * factor);
    },
    [offsetX, offsetY, factor],
  );

  return (
    <div
      data-slot="snow-background"
      className={cn('relative size-full overflow-hidden', className)}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {mounted && (
        <motion.div
          style={{ x: springX, y: springY }}
          className="pointer-events-none absolute inset-0"
        >
          {flakes.map((flake) => {
            const svgPath = SNOWFLAKE_PATHS[flake.pathIndex] ?? SNOWFLAKE_PATHS[0]!;
            return (
              <motion.div
                key={flake.id}
                className="absolute"
                style={{
                  left: `${flake.x}%`,
                  top: '-150px',
                  width: flake.size,
                  height: flake.size,
                }}
                animate={{
                  y: [0, height + 200],
                  x: [0, flake.drift, flake.drift * 0.5, flake.drift * 0.8, 0],
                  rotate: [flake.rotation, flake.rotation + flake.rotationSpeed],
                  opacity: [0, flake.opacity, flake.opacity, 0],
                }}
                transition={{
                  duration: flake.duration,
                  delay: flake.delay,
                  repeat: Infinity,
                  ease: 'linear',
                  times: [0, 0.05, 0.9, 1],
                }}
              >
                {/* Ice crystal SVG */}
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full drop-shadow-lg"
                  style={{
                    filter: isDark
                      ? `drop-shadow(0 0 ${flake.size * 0.12}px ${flake.color})`
                      : `drop-shadow(0 0 ${flake.size * 0.08}px ${flake.color})`,
                  }}
                >
                  {/* Glow circle center */}
                  <circle
                    cx="50"
                    cy="50"
                    r="5"
                    fill={flake.color}
                    opacity="0.9"
                  />
                  {/* Crystal arms */}
                  <path
                    d={svgPath}
                    stroke={flake.color}
                    strokeWidth={flake.size > 60 ? '3' : '3.5'}
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Hex outline (optional sparkle) */}
                  {flake.size > 50 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={flake.color}
                      strokeWidth="0.8"
                      fill="none"
                      opacity="0.3"
                      strokeDasharray="4 6"
                    />
                  )}
                </svg>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Content layer */}
      <div className="relative z-10 flex size-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export {
  SnowBackground,
  type SnowBackgroundProps,
};
