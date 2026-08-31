import { useAthlete } from "../contexts/AthleteContext";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Smartphone,
  Users,
} from "lucide-react";
import {
  downloadFansCsv,
  fanDisplayName,
  fetchFansList,
  formatAuthProvider,
  formatFanJoined,
  type FanContact,
} from "../lib/fansApi";

function fieldClass() {
  return "w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25";
}

type ChannelFilter = "all" | "email" | "sms";

export function SubscribersPage() {
  const { fanAppName } = useAthlete();
  const [fans, setFans] = useState<FanContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ChannelFilter>("all");
  const [stats, setStats] = useState({ emailCount: 0, smsOptIns: 0, withPhone: 0 });

  async function loadFans(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchFansList();
      setFans(data.fans);
      setStats({
        emailCount: data.emailCount,
        smsOptIns: data.smsOptIns,
        withPhone: data.withPhone,
      });
      setStatus(
        isRefresh
          ? `Refreshed ${data.count} fans from ${fanAppName} / the database`
          : `Live from ${fanAppName} — ${data.count} fans`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fan contacts");
      setFans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadFans();
  }, []);

  const filtered = useMemo(() => {
    let list = fans;
    if (filter === "sms") list = list.filter((fan) => fan.sms_opt_in || Boolean(fan.phone));
    if (filter === "email") list = list.filter((fan) => Boolean(fan.email));

    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((fan) => {
      const haystack = [
        fan.email,
        fan.name ?? "",
        fan.username ?? "",
        fan.phone ?? "",
        fan.auth_provider,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [fans, filter, query]);

  async function downloadCsv() {
    try {
      await downloadFansCsv();
      setStatus("CSV downloaded");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV export failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading live fan contacts…
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
                <Users size={12} />
                Live fan list
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Email & SMS from {fanAppName}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Contacts sync directly from the {fanAppName} app Supabase `fans` table — every signup email, phone, and SMS opt-in.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Emails</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.emailCount}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">SMS opt-in</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.smsOptIns}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">With phone</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.withPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadFans(true)}
                disabled={refreshing}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-dt-red/40 disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void downloadCsv()}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110"
              >
                <Download size={16} />
                Export CSV
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

      <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="flex flex-col gap-3 border-b border-dt-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Contacts</h3>
            <p className="text-[11px] text-white/40">
              Showing {filtered.length} of {fans.length}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
              {(
                [
                  ["all", "All"],
                  ["email", "Email"],
                  ["sms", "SMS"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                    filter === id ? "bg-dt-red text-white" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative min-w-[240px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search email, name, phone…"
                className={`${fieldClass()} pl-9`}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-semibold">Fan</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone / SMS</th>
                <th className="px-4 py-3 font-semibold">Sign-in</th>
                <th className="px-4 py-3 font-semibold">Points</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fan) => (
                <tr key={fan.email} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{fanDisplayName(fan)}</p>
                    {fan.username ? (
                      <p className="text-[11px] text-white/40">@{fan.username}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-white/85">
                      <Mail size={12} className="text-white/35" />
                      {fan.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {fan.phone || fan.sms_opt_in ? (
                      <div className="space-y-1">
                        {fan.phone ? (
                          <p className="inline-flex items-center gap-1.5 text-white/85">
                            <Smartphone size={12} className="text-white/35" />
                            {fan.phone}
                          </p>
                        ) : (
                          <p className="text-white/35">No phone</p>
                        )}
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            fan.sms_opt_in
                              ? "bg-emerald-500/15 text-emerald-200"
                              : "bg-white/5 text-white/40"
                          }`}
                        >
                          {fan.sms_opt_in ? "SMS opt-in" : "SMS off"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-white/35">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">{formatAuthProvider(fan.auth_provider)}</td>
                  <td className="px-4 py-3 font-medium text-white">{fan.points}</td>
                  <td className="px-4 py-3 text-white/55">{formatFanJoined(fan.created_at)}</td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-white/40">
                    {fans.length
                      ? "No contacts match this filter"
                      : "No fans found in Supabase yet — new signups will show here"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
