declare module "react-simple-maps" {
  import type { ReactNode } from "react";

  export type GeographyProps = {
    geography: { rsmKey: string; id?: string; properties?: Record<string, unknown> };
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: Record<string, Record<string, unknown>>;
    onClick?: () => void;
  };

  export function ComposableMap(props: {
    projection?: string;
    width?: number;
    height?: number;
    projectionConfig?: { scale?: number; center?: [number, number] };
    background?: string;
    className?: string;
    preserveAspectRatio?: string;
    style?: Record<string, string>;
    children?: ReactNode;
  }): React.JSX.Element;

  export function Geographies(props: {
    geography: string;
    children: (args: { geographies: GeographyProps["geography"][] }) => ReactNode;
  }): React.JSX.Element;

  export function Geography(props: GeographyProps): React.JSX.Element;

  export function Marker(props: {
    coordinates: [number, number];
    children?: ReactNode;
  }): React.JSX.Element;
}
