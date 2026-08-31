import type { ReactElement, SVGProps } from "react";
import type { BallKind } from "../../lib/sportsCatalog";

type BallProps = SVGProps<SVGSVGElement> & { size?: number };

function frame({ size = 40, ...rest }: BallProps) {
  return { width: size, height: size, viewBox: "0 0 48 48", ...rest };
}

const stroke = {
  fill: "none",
  stroke: "rgba(0,0,0,0.45)",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
};

function Basketball(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#EE6730" />
      <g {...stroke}>
        <circle cx="24" cy="24" r="18" />
        <path d="M6 24h36M24 6v36" />
        <path d="M11 11c8 4 12 10 12 13s-4 9-12 13" />
        <path d="M37 11c-8 4-12 10-12 13s4 9 12 13" />
      </g>
    </svg>
  );
}

function Football(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <g transform="rotate(-25 24 24)">
        <path
          d="M6 24c6-9 12-13 18-13s12 4 18 13c-6 9-12 13-18 13s-12-4-18-13Z"
          fill="#7B3F16"
        />
        <path
          d="M6 24c6-9 12-13 18-13s12 4 18 13c-6 9-12 13-18 13s-12-4-18-13Z"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.4"
        />
        <g stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M18 24h12" />
          <path d="M21 21.5v5M24 21v6M27 21.5v5" />
        </g>
      </g>
    </svg>
  );
}

function Baseball(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#F5F3EE" />
      <g fill="none" stroke="#D50032" strokeWidth="1.6" strokeLinecap="round">
        <path d="M13 9c4 4 6 9 6 15s-2 11-6 15" />
        <path d="M35 9c-4 4-6 9-6 15s2 11 6 15" />
        <path d="M16 13l2 2M15 18l2 1M15 24h2M15 30l2-1M16 35l2-2" />
        <path d="M32 13l-2 2M33 18l-2 1M33 24h-2M33 30l-2-1M32 35l-2-2" />
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.4" />
    </svg>
  );
}

function Softball(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#D9EE5A" />
      <g fill="none" stroke="#5A6B00" strokeWidth="1.6" strokeLinecap="round">
        <path d="M13 9c4 4 6 9 6 15s-2 11-6 15" />
        <path d="M35 9c-4 4-6 9-6 15s2 11 6 15" />
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.4" />
    </svg>
  );
}

function Soccer(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#F7F7F7" />
      <g fill="#101010">
        <path d="M24 13l6 4.4-2.3 7h-7.4l-2.3-7Z" />
        <path d="M24 41c-3 0-5.8-.7-8.2-2l3-4.6h10.4l3 4.6c-2.4 1.3-5.2 2-8.2 2Z" />
        <path d="M9.2 18.4 14 22l-1.6 7-4.9 1.2a17.9 17.9 0 0 1 1.7-11.8Z" />
        <path d="M38.8 18.4a17.9 17.9 0 0 1 1.7 11.8L35.6 29 34 22Z" />
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.4" />
    </svg>
  );
}

function Tennis(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#D7F205" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
        <path d="M11 10c5 4 7.5 8.6 7.5 14S16 34 11 38" />
        <path d="M37 10c-5 4-7.5 8.6-7.5 14S32 34 37 38" />
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.4" />
    </svg>
  );
}

function Golf(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#FAFAF7" />
      <g fill="rgba(0,0,0,0.14)">
        {[14, 20, 26, 32].map((x) =>
          [14, 20, 26, 32].map((y) => {
            const dx = x - 24;
            const dy = y - 24;
            if (dx * dx + dy * dy > 190) return null;
            return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />;
          }),
        )}
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1.4" />
    </svg>
  );
}

function Volleyball(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#FFFFFF" />
      <g fill="none" stroke="#F2B400" strokeWidth="2.4" strokeLinecap="round">
        <path d="M24 6c-6 6-8 12-8 18s2 12 8 18" />
        <path d="M24 6c6 6 8 12 8 18s-2 12-8 18" />
        <path d="M6.5 20c6 2 12 2.5 17.5 2.5S35.5 22 41.5 20" />
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1.4" />
    </svg>
  );
}

function Hockey(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <ellipse cx="24" cy="30" rx="15" ry="6" fill="#121212" />
      <rect x="9" y="18" width="30" height="12" fill="#1c1c1c" />
      <ellipse cx="24" cy="18" rx="15" ry="6" fill="#2c2c2c" />
      <ellipse cx="24" cy="18" rx="15" ry="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
    </svg>
  );
}

function Track(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <rect x="5" y="10" width="38" height="28" rx="14" fill="#C0392B" />
      <g fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5">
        <rect x="9" y="14" width="30" height="20" rx="10" />
        <rect x="13" y="18" width="22" height="12" rx="6" />
      </g>
    </svg>
  );
}

function Swim(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#00B7E4" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round">
        <path d="M11 20c3-3 5-3 8 0s5 3 8 0 5-3 8 0" />
        <path d="M11 28c3-3 5-3 8 0s5 3 8 0 5-3 8 0" />
      </g>
    </svg>
  );
}

function Gymnastics(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#FF5FA2" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round">
        <path d="M13 33c6-2 8-7 6-11s2-9 8-9" />
        <circle cx="30" cy="31" r="4" />
      </g>
    </svg>
  );
}

function Combat(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <path
        d="M14 16h13a9 9 0 0 1 9 9v4a7 7 0 0 1-7 7H18a6 6 0 0 1-6-6v-2h-1a4 4 0 0 1 0-8h1Z"
        fill="#D62828"
      />
      <path d="M14 30h22" stroke="rgba(0,0,0,0.4)" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

function Esports(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <rect x="6" y="16" width="36" height="18" rx="9" fill="#7C4DFF" />
      <g fill="#FFFFFF">
        <rect x="13" y="24" width="8" height="2.2" rx="1.1" />
        <rect x="16" y="21" width="2.2" height="8" rx="1.1" />
        <circle cx="31" cy="23" r="2" />
        <circle cx="35" cy="27" r="2" />
      </g>
    </svg>
  );
}

function Generic(props: BallProps) {
  return (
    <svg {...frame(props)} aria-hidden>
      <circle cx="24" cy="24" r="18" fill="var(--theme-accent)" />
      <g {...stroke}>
        <path d="M24 6v36M6 24h36" />
      </g>
    </svg>
  );
}

export const ballIcons: Record<BallKind, (props: BallProps) => ReactElement> = {
  basketball: Basketball,
  football: Football,
  baseball: Baseball,
  softball: Softball,
  soccer: Soccer,
  tennis: Tennis,
  golf: Golf,
  volleyball: Volleyball,
  hockey: Hockey,
  track: Track,
  swim: Swim,
  gymnastics: Gymnastics,
  combat: Combat,
  esports: Esports,
  generic: Generic,
};

export function BallIcon({ kind, size = 40, ...rest }: BallProps & { kind: BallKind }) {
  const Icon = ballIcons[kind] ?? Generic;
  return <Icon size={size} {...rest} />;
}
