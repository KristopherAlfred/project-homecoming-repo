import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Activity,
  Check,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Smartphone,
  TrendingUp,
  Users,
  UserCheck,
  Wrench,
} from "lucide-react";
import { SignupHeatmap } from "../components/SignupHeatmap";
import {
  fetchDametimeAnalytics,
  formatMetric,
  formatRelativeTime,
  initialsFromName,
  type DametimeAnalytics,
} from "../lib/dametimeAnalyticsApi";
import {
  fanDisplayName,
  fanLocationLabel,
  fetchFansList,
  setFanLocation,
  type FanContact,
} from "../lib/fansApi";

const POLL_MS = 45_000;

type GeocodeResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
};

async function geocodeCity(query: string): Promise<GeocodeResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`City lookup failed (${response.status})`);
  const data = (await response.json()) as { results?: GeocodeResult[] };
  return data.results ?? [];
}

function geocodeLabel(place: GeocodeResult) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

function FixFanLocation({ onSaved }: { onSaved: () => void }) {
  const [fans, setFans] = useState<FanContact[]>([]);
  const [fanQuery, setFanQuery] = useState("");
  const [fanMenuOpen, setFanMenuOpen] = useState(false);
  const [selectedFan, setSelectedFan] = useState<FanContact | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<GeocodeResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetchFansList()
      .then((data) => setFans(data.fans))
      .catch((err) =>
        setErrorMsg(err instanceof Error ? err.message : "Could not load fan list"),
      );
  }, []);

  const fanOptions = useMemo(() => {
    const q = fanQuery.trim().toLowerCase();
    const list = !q
      ? fans
      : fans.filter((fan) =>
          [fan.email, fan.name ?? "", fan.username ?? ""].join(" ").toLowerCase().includes(q),
        );
    return list.slice(0, 30);
  }, [fans, fanQuery]);

  async function onSearchCity() {
    const q = cityQuery.trim();
    if (!q) return;
    setSearching(true);
    setErrorMsg(null);
    setSelectedPlace(null);
    try {
      const results = await geocodeCity(q);
      setCityResults(results);
      if (!results.length) setErrorMsg(`No cities found for “${q}” — try adding the state or country.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "City lookup failed");
    } finally {
      setSearching(false);
    }
  }

  async function onSave() {
    if (!selectedFan || !selectedPlace) return;
    setSaving(true);
    setErrorMsg(null);
    setMessage(null);
    try {
      await setFanLocation(selectedFan.email, {
        city: selectedPlace.name,
        region: selectedPlace.admin1 ?? null,
        country_name: selectedPlace.country ?? null,
        country_code: selectedPlace.country_code?.toUpperCase() ?? null,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      });
      setMessage(`${fanDisplayName(selectedFan)} is now mapped to ${geocodeLabel(selectedPlace)}.`);
      setFans((prev) =>
        prev.map((fan) =>
          fan.email === selectedFan.email
            ? {
                ...fan,
                city: selectedPlace.name,
                region: selectedPlace.admin1 ?? null,
                country_name: selectedPlace.country ?? null,
                country_code: selectedPlace.country_code?.toUpperCase() ?? null,
              }
            : fan,
        ),
      );
      setCityResults([]);
      setCityQuery("");
      setSelectedPlace(null);
      onSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
      <div className="border-b border-dt-border px-4 py-3.5">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-white">
          <Wrench size={14} className="text-dt-red" /> Fix a fan&apos;s location
        </h3>
        <p className="mt-0.5 text-[11px] text-white/40">
          Locations come from IP lookup, which can be off by a city or two. Pick a fan, search the
          correct city, and save — the map updates right away.
        </p>
      </div>

      <div className="space-y-4 p-4">
        {errorMsg ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMsg}</div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/45">1. Pick the fan</p>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={fanMenuOpen || !selectedFan ? fanQuery : fanDisplayName(selectedFan)}
              onChange={(e) => {
                setFanQuery(e.target.value);
                setFanMenuOpen(true);
              }}
              onFocus={() => {
                setFanMenuOpen(true);
                if (selectedFan) setFanQuery("");
              }}
              placeholder="Search fans by name or email…"
              className="w-full rounded-xl border border-dt-border bg-black/50 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25"
            />
            {fanMenuOpen ? (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-dt-border bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
                {fanOptions.map((fan) => (
                  <button
                    key={fan.email}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setSelectedFan(fan);
                      setFanMenuOpen(false);
                      setFanQuery("");
                      setMessage(null);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-white/70">
                      {initialsFromName(fanDisplayName(fan))}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{fanDisplayName(fan)}</p>
                      <p className="truncate text-[11px] text-white/40">
                        {fan.email}
                        {fanLocationLabel(fan) ? ` · ${fanLocationLabel(fan)}` : " · no location"}
                      </p>
                    </div>
                  </button>
                ))}
                {!fanOptions.length ? (
                  <p className="px-3 py-6 text-center text-xs text-white/40">No fans match that search</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {selectedFan ? (
            <p className="mt-1.5 text-xs text-white/55">
              Current stored location:{" "}
              <span className="text-white">{fanLocationLabel(selectedFan) ?? "none captured"}</span>
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/45">2. Search the correct city</p>
          <div className="flex gap-2">
            <input
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onSearchCity();
                }
              }}
              placeholder="e.g. Dallas"
              className="min-w-0 flex-1 rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25"
            />
            <button
              type="button"
              onClick={() => void onSearchCity()}
              disabled={searching || !cityQuery.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-white/80 transition hover:border-dt-red/40 disabled:opacity-50"
            >
              {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Find city
            </button>
          </div>
          {cityResults.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {cityResults.map((place) => {
                const active = selectedPlace?.id === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => setSelectedPlace(place)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                      active
                        ? "border-dt-red/60 bg-dt-red/10 text-white"
                        : "border-white/10 bg-black/25 text-white/75 hover:border-dt-red/35"
                    }`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <MapPin size={13} className={active ? "text-dt-red" : "text-white/35"} />
                      <span className="truncate">{geocodeLabel(place)}</span>
                    </span>
                    {active ? <Check size={14} className="shrink-0 text-dt-red" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!selectedFan || !selectedPlace || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-dt-red px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save correct location
        </button>
      </div>
    </section>
  );
}

export function AudienceOverviewPage() {
  const { fanAppName } = useAthlete();
  const [analytics, setAnalytics] = useState<DametimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await fetchDametimeAnalytics();
      setAnalytics(data);
      setStatus(
        isRefresh
          ? `Refreshed · ${new Date(data.syncedAt).toLocaleString()}`
          : `Live from ${fanAppName} · synced ${new Date(data.syncedAt).toLocaleString()}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audience overview");
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

  const maxCountry = useMemo(() => {
    if (!analytics?.geo.countries.length) return 1;
    return Math.max(...analytics.geo.countries.map((c) => c.count), 1);
  }, [analytics]);

  const mappedPct = useMemo(() => {
    if (!analytics?.geo.totalFans) return 0;
    return Math.round((analytics.geo.mappedFans / analytics.geo.totalFans) * 100);
  }, [analytics]);

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading live audience…
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || "No audience data available."}
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-dt-red px-4 py-2.5 text-sm font-semibold text-white"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const kpis = [
    { label: "Total fans", value: formatMetric(analytics.kpis.totalFans), Icon: Users },
    { label: "Email captures", value: formatMetric(analytics.kpis.emailCaptures), Icon: Mail },
    { label: "SMS opt-ins", value: formatMetric(analytics.kpis.smsOptIns), Icon: Smartphone },
    { label: "Active (7d)", value: formatMetric(analytics.kpis.activeFans7d), Icon: UserCheck },
    { label: "Engagement", value: `${analytics.kpis.engagementRate}%`, Icon: TrendingUp },
    { label: "Sign-ups", value: formatMetric(analytics.kpis.signups), Icon: Activity },
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Globe2 size={12} />
                Fan Locations
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Where {fanAppName} fans are signing up
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Live composition from Supabase — signups, email & SMS capture, active fans, and where they’re located.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Fans</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.totalFans)}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Mapped</p>
                <p className="mt-1 text-lg font-bold text-white">{mappedPct}%</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Active 7d</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.activeFans7d)}</p>
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, Icon }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-dt-border bg-dt-card p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(var(--theme-accent-rgb),0.16),transparent_55%)]" />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
              <Icon size={18} className="mt-0.5 shrink-0 text-dt-red" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border px-4 py-3.5">
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Top countries</h3>
            <p className="text-[11px] text-white/40">
              {formatMetric(analytics.geo.mappedFans)} of {formatMetric(analytics.geo.totalFans)} fans mapped
            </p>
          </div>
          <div className="space-y-3 p-4">
            {analytics.geo.countries.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/40">No country data yet — new signups will appear here.</p>
            ) : (
              analytics.geo.countries.slice(0, 8).map((country) => (
                <div key={country.country}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-white">
                      <span className="mr-1.5">{country.flag}</span>
                      {country.country}
                    </span>
                    <span className="shrink-0 tabular-nums text-white/70">
                      {country.pct}% · {formatMetric(country.count)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-dt-red to-[#ff4d57]"
                      style={{ width: `${Math.max(4, (country.count / maxCountry) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border px-4 py-3.5">
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Audience pulse</h3>
            <p className="text-[11px] text-white/40">How the base engages in the app</p>
          </div>
          <div className="space-y-3 p-4">
            {[
              { label: "Engagement rate (7d)", value: `${analytics.kpis.engagementRate}%`, hint: "Active share of fans" },
              { label: "Total events", value: formatMetric(analytics.kpis.totalEvents), hint: "All tracked fan_events" },
              { label: "Page views", value: formatMetric(analytics.kpis.pageViews), hint: "Screens opened in app" },
              { label: "Total clicks", value: formatMetric(analytics.kpis.totalClicks), hint: "Cards, nav, CTAs" },
              {
                label: "Geo coverage",
                value: `${formatMetric(analytics.geo.mappedFans)} / ${formatMetric(analytics.geo.totalFans)}`,
                hint: "Fans with mapped location",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/25 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{row.label}</p>
                  <p className="text-[11px] text-white/40">{row.hint}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-white">{row.value}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="flex flex-col gap-1 border-b border-dt-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Signup map</h3>
            <p className="text-[11px] text-white/40">Where {fanAppName} fans are signing up from</p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
            <MapPin size={12} className="text-dt-red" />
            {analytics.geo.points.length} hotspot{analytics.geo.points.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <SignupHeatmap geo={analytics.geo} />
        </div>
        {analytics.geo.points.length > 0 ? (
          <div className="border-t border-dt-border px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">Top cities</p>
            <div className="flex flex-wrap gap-2">
              {analytics.geo.points.slice(0, 10).map((point) => (
                <span
                  key={`${point.lat}-${point.lng}-${point.label}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-white/80"
                >
                  <span className="max-w-[180px] truncate">{point.label}</span>
                  <span className="font-semibold text-dt-red">{formatMetric(point.count)}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <FixFanLocation onSaved={() => void load(true)} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="flex items-center justify-between border-b border-dt-border px-4 py-3.5">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Most engaged fans</h3>
              <p className="text-[11px] text-white/40">Top by in-app points & events</p>
            </div>
            <Link
              to="/engagement/activity"
              className="text-xs font-semibold text-dt-red transition hover:brightness-125"
            >
              Fan activity →
            </Link>
          </div>
          <div className="divide-y divide-dt-border">
            {analytics.topUsers.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-white/40">No fan activity yet.</p>
            ) : (
              analytics.topUsers.slice(0, 8).map((fan, index) => {
                const name = fan.name || fan.username || fan.email;
                return (
                  <div key={fan.email} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-white/35">
                      {index + 1}
                    </span>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dt-red/30 bg-dt-red/15 text-xs font-bold text-white">
                      {initialsFromName(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{name}</p>
                      <p className="truncate text-[11px] text-white/40">{fan.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-white">{formatMetric(fan.points)}</p>
                      <p className="text-[10px] text-white/40">{formatMetric(fan.eventCount)} events</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            <div className="border-b border-dt-border px-4 py-3.5">
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Recent signups & actions</h3>
              <p className="text-[11px] text-white/40">Latest fan_events across the app</p>
            </div>
            <div className="divide-y divide-dt-border">
              {analytics.recentActivity.slice(0, 6).map((item, idx) => (
                <div key={`${item.at}-${item.email}-${idx}`} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-white/70">
                    {initialsFromName(item.displayName || item.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      <span className="font-medium">{item.displayName || item.email}</span>
                      <span className="text-white/45"> · {item.action}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {formatRelativeTime(item.at)}
                      {item.target ? ` · ${item.target}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {analytics.recentActivity.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-white/40">Waiting for live activity…</p>
              ) : null}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link
              to="/fans/subscribers"
              className="group rounded-2xl border border-dt-border bg-dt-card p-4 transition hover:border-dt-red/40"
            >
              <div className="mb-2 inline-flex rounded-lg border border-dt-red/25 bg-dt-red/10 p-2 text-dt-red">
                <Mail size={16} />
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-dt-red">Email / SMS list</p>
              <p className="mt-1 text-xs text-white/45">Export contacts and opt-ins from Supabase</p>
            </Link>
            <Link
              to="/performance/traffic"
              className="group rounded-2xl border border-dt-border bg-dt-card p-4 transition hover:border-dt-red/40"
            >
              <div className="mb-2 inline-flex rounded-lg border border-dt-red/25 bg-dt-red/10 p-2 text-dt-red">
                <Activity size={16} />
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-dt-red">Traffic overview</p>
              <p className="mt-1 text-xs text-white/45">Page views and clicks by fan</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
