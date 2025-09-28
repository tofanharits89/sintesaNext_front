import { Button } from "@/components/ui/button";
import { useHoverPreload } from "@/hooks/use-preload";
import { ComponentProps } from "react";

interface LazyButtonProps extends ComponentProps<typeof Button> {
  preloadComponent?: () => Promise<any>;
}

export function LazyButton({ preloadComponent, ...props }: LazyButtonProps) {
  const preloadProps = preloadComponent ? useHoverPreload(preloadComponent) : {};
  
  return <Button {...props} {...preloadProps} />;
}