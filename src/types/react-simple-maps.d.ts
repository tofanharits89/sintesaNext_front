declare module "react-simple-maps" {
  import { ComponentType, MouseEvent, ReactNode } from "react";

  export interface ProjectionConfig {
    center?: [number, number];
    scale?: number;
    rotate?: [number, number, number];
    parallels?: [number, number];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    viewBox?: string;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    children?: ReactNode;
    onMoveStart?: (pos: {
      coordinates: [number, number];
      zoom: number;
    }) => void;
    onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void;
  }

  export interface GeoFeature {
    rsmKey: string;
    type: string;
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }

  export interface GeographiesChildrenProps {
    geographies: GeoFeature[];
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesChildrenProps) => ReactNode;
  }

  export interface GeographyProps {
    geography: GeoFeature;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onClick?: (event: MouseEvent<SVGPathElement>, geo: GeoFeature) => void;
    onMouseEnter?: (event: MouseEvent<SVGPathElement>, geo: GeoFeature) => void;
    onMouseMove?: (event: MouseEvent<SVGPathElement>, geo: GeoFeature) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>, geo: GeoFeature) => void;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
