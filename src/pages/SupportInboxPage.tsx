import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Mail, RefreshCw, Search } from "lucide-react";
import {
  fetchSupportReports,
  formatSupportDate,
  supportReporterName,
  type SupportReport,
} from "../lib/supportApi";

const POLL_MS = 45_000;

export function SupportInboxPage() {
  const { fanAppName } = useAthlete();
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const next = await fetchSupportReports(150);
      setReports(next);
      setSelectedId((prev) => prev ?? next[0]?.id ?? null);
      setStatus(
        isRefresh
          ? `Refreshed ${next.length} support reports`
          : `Live from ${fanAppName} Help & Support · ${next.length} reports`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((report) => {
      const haystack = [report.subject ?? "", report.message, report.email ?? "", report.name ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [reports, query]);

  const selected = filtered.find((report) => report.id === selectedId) ?? filtered[0] ?? null;

  if (loading && !reports.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading support inbox…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Inbox size={12} />
                Support inbox
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Help reports from the {fanAppName} app
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Messages fans submit in Help & Support land here live from Supabase — subject, message, contact, and page.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Open</p>
                <p className="mt-1 text-lg font-bold text-white">{reports.length}</p>
              </div>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {(error || status) && (
          <div className="space-y-2 border-b border-dt-border px-5 py-3">
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            ) : null}
            {status && !error ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {status}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border p-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject, email, message…"
                className="w-full rounded-xl border border-dt-border bg-black/50 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-dt-red/55"
              />
            </div>
          </div>
          <ul className="max-h-[62vh] overflow-y-auto">
            {filtered.map((report) => {
              const active = selected?.id === report.id;
              return (
                <li key={report.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(report.id)}
                    className={`w-full border-b border-white/[0.04] px-4 py-3 text-left transition ${
                      active ? "bg-dt-red/10" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {report.subject || "Support request"}
                      </p>
                      <span className="shrink-0 text-[10px] text-white/35">
                        {formatSupportDate(report.created_at).split(",")[0]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[12px] text-white/55">{supportReporterName(report)}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{report.message}</p>
                  </button>
                </li>
              );
            })}
            {!filtered.length ? (
              <li className="px-4 py-16 text-center text-sm text-white/40">
                {reports.length ? "No reports match that search" : "No support reports yet"}
              </li>
            ) : null}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          {selected ? (
            <div className="flex h-full min-h-[420px] flex-col">
              <div className="border-b border-dt-border px-5 py-4">
                <p className="font-display text-lg font-semibold text-white">
                  {selected.subject || "Support request"}
                </p>
                <p className="mt-1 text-xs text-white/40">{formatSupportDate(selected.created_at)}</p>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">From</p>
                    <p className="mt-1 font-medium text-white">{supportReporterName(selected)}</p>
                    {selected.email ? (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/60">
                        <Mail size={12} /> {selected.email}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-white/40">No email provided</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Page</p>
                    <p className="mt-1 break-all text-sm text-white/75">
                      {selected.page_url || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                    {selected.message}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center text-sm text-white/40">
              Select a report to read it
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
