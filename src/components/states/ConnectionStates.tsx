import { Link } from "@/lib/router-compat";
import { Link2, PlugZap } from "lucide-react";
import { CONNECT_PLATFORMS_ROUTE } from "../../lib/socialSources";

/**
 * The one "not connected yet" pattern used everywhere in the dashboard.
 * Never render a zero or example number for a source the athlete has not
 * connected — render one of these instead.
 */
export function NotConnectedCard({
  platform,
  message,
  className = "",
  compact = false,
}: {
  platform: string;
  message?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/25 ${
        compact ? "p-4" : "p-6"
      } ${className}`}
    >
      <div className="flex flex-col gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-dt-red">
          <PlugZap size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{platform} not connected</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/45">
            {message ?? `Connect your ${platform} account to see live analytics`}
          </p>
        </div>
        <Link
          to={CONNECT_PLATFORMS_ROUTE}
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-dt-red px-3 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
        >
          <Link2 size={13} />
          Connect {platform}
        </Link>
      </div>
    </div>
  );
}

/** Loading placeholder for a metric card — used instead of fake numbers. */
export function MetricSkeleton({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dt-border bg-dt-card p-4 ${className}`}
    >
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
      ) : (
        <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
      )}
      <div className="mt-3 h-7 w-24 animate-pulse rounded bg-white/10" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-white/5" />
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export function SkeletonPanel({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`rounded-2xl border border-dt-border bg-dt-card p-5 ${height}`}>
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="mt-4 h-[70%] w-full opacity-60" />
    </div>
  );
}

/** Connected, but nothing to show yet. */
export function NoDataState({
  title,
  message,
  className = "",
}: {
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-dt-border bg-dt-card px-5 py-10 text-center ${className}`}
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-white/45">{message}</p>
    </div>
  );
}
