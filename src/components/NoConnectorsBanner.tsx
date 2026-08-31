import { Link } from "@/lib/router-compat";

export function NoConnectorsBanner() {
  return (
    <div className="dt-surface relative overflow-hidden rounded-xl border border-dt-border bg-dt-card px-6 py-12 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--theme-accent-rgb),0.08),transparent_60%)]" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          No connected platforms yet
        </h2>
        <p className="max-w-md text-base leading-relaxed text-dt-muted">
          Connect your social and analytics accounts to populate the dashboard with real data.
        </p>
        <Link
          to="/settings"
          className="mt-2 rounded-lg bg-dt-red px-6 py-3 text-base font-bold text-black transition-colors hover:bg-dt-red-hover"
        >
          Connect platforms in Settings
        </Link>
      </div>
    </div>
  );
}
