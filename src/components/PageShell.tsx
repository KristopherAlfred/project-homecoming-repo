import type { ReactNode } from "react";

export function PageShell({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {actions && <div className="flex justify-end">{actions}</div>}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  return (
    <div className="dt-surface rounded-lg border border-dt-border bg-dt-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-dt-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {trend && (
        <p className="mt-1 text-xs font-medium text-dt-green">{trend}</p>
      )}
      {hint && <p className="mt-1 text-xs text-dt-muted">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`dt-surface rounded-lg border border-dt-border bg-dt-card ${className}`}>
      <div className="dt-surface-header border-b border-dt-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold tracking-wide text-white">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
