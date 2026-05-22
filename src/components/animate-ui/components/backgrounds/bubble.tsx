'use client';

import * as React from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from 'motion/react';

import { cn } from '../../../../lib/utils/utils';

// Warna-warna bubble yang vibrant dan lembut (light & dark mode aware)
const BUBBLE_COLORS_DARK = [
  'rgba(139, 92, 246, 0.45)',   // violet
  'rgba(59, 130, 246, 0.45)',   // blue
  'rgba(16, 185, 129, 0.40)',   // emerald
  'rgba(245, 158, 11, 0.40)',   // amber
  'rgba(239, 68, 68, 0.40)',    // red
  'rgba(236, 72, 153, 0.40)',   // pink
  'rgba(6, 182, 212, 0.40)',    // cyan
  'rgba(168, 85, 247, 0.40)',   // purple
  'rgba(34, 197, 94, 0.35)',    // green
  'rgba(249, 115, 22, 0.40)',   // orange
];

const BUBBLE_COLORS_LIGHT = [
  'rgba(139, 92, 246, 0.25)',
  'rgba(59, 130, 246, 0.25)',
  'rgba(16, 185, 129, 0.22)',
  'rgba(245, 158, 11, 0.22)',
  'rgba(239, 68, 68, 0.22)',
  'rgba(236, 72, 153, 0.22)',
  'rgba(6, 182, 212, 0.22)',
  'rgba(168, 85, 247, 0.22)',
  'rgba(34, 197, 94, 0.20)',
  'rgba(249, 115, 22, 0.22)',
];

interface BubbleItem {
  id: number;
  x: number;        // posisi horizontal (%)
  size: number;     // diameter px
  color: string;    // warna
  duration: number; // durasi animasi naik (detik)
  delay: number;    // delay awal
  drift: number;    // gerakan horizontal
  blur: number;     // blur px
  opacity: number;  // opacity
}

function generateBubbles(count: number, isDark: boolean): BubbleItem[] {
  const colors = isDark ? BUBBLE_COLORS_DARK : BUBBLE_COLORS_LIGHT;
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 20 + Math.random() * 120,
    color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0] ?? 'rgba(139,92,246,0.4)',
    duration: 8 + Math.random() * 20,
    delay: Math.random() * -25,  // negative delay = sudah mulai
    drift: (Math.random() - 0.5) * 120,
    blur: 4 + Math.random() * 8,
    opacity: 0.5 + Math.random() * 0.5,
  }));
}

type BubblesBackgroundProps = React.ComponentProps<'div'> & {
  count?: number;
  factor?: number;
  pointerEvents?: boolean;
  isDark?: boolean;
};

function BubblesBackground({
  children,
  className,
  count = 25,
  factor = 0.04,
  pointerEvents = true,
  isDark = false,
  ...props
}: BubblesBackgroundProps) {
  const [bubbles, setBubbles] = React.useState<BubbleItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const springOptions: SpringOptions = { stiffness: 50, damping: 20 };
  const springX = useSpring(offsetX, springOptions);
  const springY = useSpring(offsetY, springOptions);

  React.useEffect(() => {
    setMounted(true);
    setBubbles(generateBubbles(count, isDark));
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
      data-slot="bubbles-background"
      className={cn('relative size-full overflow-hidden', className)}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {/* Bubble layer */}
      {mounted && (
        <motion.div
          style={{ x: springX, y: springY }}
          className={cn('pointer-events-none absolute inset-0', {
            'pointer-events-none': !pointerEvents,
          })}
        >
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className="absolute rounded-full"
              style={{
                left: `${bubble.x}%`,
                bottom: '-150px',
                width: bubble.size,
                height: bubble.size,
                background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35), ${bubble.color})`,
                boxShadow: `0 0 ${bubble.blur * 2}px ${bubble.blur}px ${bubble.color}, inset 0 0 ${bubble.blur}px rgba(255,255,255,0.2)`,
                filter: `blur(${bubble.blur * 0.15}px)`,
                backdropFilter: 'blur(2px)',
                border: `1px solid rgba(255,255,255,0.3)`,
                opacity: bubble.opacity,
              }}
              animate={{
                y: [0, -(window?.innerHeight ?? 900) - 200],
                x: [0, bubble.drift, bubble.drift * 0.4, 0],
                scale: [0.8, 1.05, 0.95, 1],
                opacity: [0, bubble.opacity, bubble.opacity * 0.8, 0],
              }}
              transition={{
                duration: bubble.duration,
                delay: bubble.delay,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.3, 0.7, 1],
              }}
            />
          ))}
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
  BubblesBackground,
  type BubblesBackgroundProps,
};
