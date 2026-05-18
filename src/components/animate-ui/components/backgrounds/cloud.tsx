'use client';

import * as React from 'react';
import {
  type HTMLMotionProps,
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
  type Transition,
} from 'motion/react';

import { cn } from '../../../../lib/utils/utils';

type CloudLayerProps = HTMLMotionProps<'div'> & {
  count: number;
  size: number;
  transition: Transition;
  cloudColor: string;
  opacity: number;
};

interface CloudItem {
  id: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

function generateClouds(count: number): CloudItem[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.floor(Math.random() * 4000), // Random X across 4000px width
    y: Math.floor(Math.random() * 800) - 100, // Mostly upper half
    scale: 0.6 + Math.random() * 1.5, // Random scale between 0.6x and 2.1x
    opacity: 0.4 + Math.random() * 0.6, // Random opacity modifier
  }));
}

function CloudLayer({
  count = 15,
  size = 100,
  transition = { repeat: Infinity, duration: 120, ease: 'linear' },
  cloudColor = 'rgba(255, 255, 255, 0.2)',
  opacity = 0.6,
  className,
  ...props
}: CloudLayerProps) {
  const [clouds, setClouds] = React.useState<CloudItem[]>([]);

  React.useEffect(() => {
    setClouds(generateClouds(count));
  }, [count]);

  const renderClouds = (offsetX: number) => (
    <div
      className="absolute top-0 bottom-0"
      style={{ left: `${offsetX}px`, width: '4000px' }}
    >
      {clouds.map((c) => (
        <svg
          key={c.id}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={cloudColor}
          className="absolute"
          style={{
            left: `${c.x}px`,
            top: `${c.y}px`,
            width: `${size * c.scale}px`,
            height: `${size * c.scale}px`,
            opacity: c.opacity,
            filter: `blur(${size * 0.05}px)`, // Slight blur for softness
          }}
        >
          {/* A beautiful solid cloud path */}
          <path d="M17.5 19A4.5 4.5 0 0 0 22 14.5c0-2.31-1.74-4.22-4.01-4.47A7.5 7.5 0 0 0 10.6 2.05 7.5 7.5 0 0 0 3.32 9.2 4.5 4.5 0 0 0 3.5 18H17.5z" />
        </svg>
      ))}
    </div>
  );

  return (
    <motion.div
      data-slot="cloud-layer"
      animate={{ x: [0, -4000] }}
      transition={transition}
      className={cn('absolute top-0 left-0 h-full w-[8000px]', className)}
      style={{ opacity }}
      {...props}
    >
      {/* First set of clouds */}
      {renderClouds(0)}
      {/* Duplicate set for seamless horizontal looping */}
      {renderClouds(4000)}
    </motion.div>
  );
}

type CloudsBackgroundProps = React.ComponentProps<'div'> & {
  factor?: number;
  speed?: number;
  transition?: SpringOptions;
  cloudColor?: string;
  pointerEvents?: boolean;
};

function CloudsBackground({
  children,
  className,
  factor = 0.03,
  speed = 120,
  transition = { stiffness: 50, damping: 20 },
  cloudColor = 'rgba(255, 255, 255, 0.15)',
  pointerEvents = true,
  ...props
}: CloudsBackgroundProps) {
  const offsetX = useMotionValue(1);
  const offsetY = useMotionValue(1);

  const springX = useSpring(offsetX, transition);
  const springY = useSpring(offsetY, transition);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const newOffsetX = -(e.clientX - centerX) * factor;
      const newOffsetY = -(e.clientY - centerY) * factor;
      offsetX.set(newOffsetX);
      offsetY.set(newOffsetY);
    },
    [offsetX, offsetY, factor],
  );

  return (
    <div
      data-slot="clouds-background"
      className={cn(
        'relative size-full overflow-hidden',
        className,
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        style={{ x: springX, y: springY }}
        className={cn('absolute inset-0', { 'pointer-events-none': !pointerEvents })}
      >
        {/* Layer 1: Small clouds — far away, many, slow */}
        <CloudLayer
          count={25}
          size={50}
          opacity={0.5}
          transition={{ repeat: Infinity, duration: speed * 1.5, ease: 'linear' }}
          cloudColor={cloudColor}
        />
        {/* Layer 2: Medium clouds — mid distance */}
        <CloudLayer
          count={15}
          size={100}
          opacity={0.7}
          transition={{
            repeat: Infinity,
            duration: speed,
            ease: 'linear',
          }}
          cloudColor={cloudColor}
        />
        {/* Layer 3: Large clouds — close up, few, fast */}
        <CloudLayer
          count={8}
          size={180}
          opacity={1}
          transition={{
            repeat: Infinity,
            duration: speed * 0.7,
            ease: 'linear',
          }}
          cloudColor={cloudColor}
        />
      </motion.div>
      <div className="relative z-10 flex size-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export {
  CloudLayer,
  CloudsBackground,
  type CloudLayerProps,
  type CloudsBackgroundProps,
};
