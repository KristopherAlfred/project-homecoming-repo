import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`dt-surface rounded-lg border border-dt-border bg-dt-card ${className}`}
    >
      {(title || action) && (
        <div className="dt-surface-header flex items-center justify-between gap-3 border-b border-dt-border px-4 py-3">
          {title && (
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-white">
              {title}
            </h3>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
