import { useAthlete } from "../contexts/AthleteContext";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "./ui/Card";
import {
  fetchDametimeAnalytics,
  formatMetric,
  type DametimeAnalyticsGeo,
} from "../lib/dametimeAnalyticsApi";
import { viewIdFromCountryCode, viewIdFromCountryName } from "../data/signupGeoData";

type CountryRow = DametimeAnalyticsGeo["countries"][number] & { key: string };

const FEATURED_COUNTRIES: Array<{ key: string; country: string; flag: string; codes: string[] }> = [
  { key: "USA", country: "USA", flag: "🇺🇸", codes: ["US"] },
  { key: "Canada", country: "Canada", flag: "🇨🇦", codes: ["CA"] },
  { key: "UK", country: "UK", flag: "🇬🇧", codes: ["GB", "UK"] },
  { key: "Australia", country: "Australia", flag: "🇦🇺", codes: ["AU"] },
  { key: "Other", country: "Other", flag: "🌍", codes: [] },
];

function matchFeaturedKey(country: DametimeAnalyticsGeo["countries"][number]): string {
  const fromCode = viewIdFromCountryCode(country.countryCode);
  if (fromCode && fromCode !== "world" && fromCode !== "Other") return fromCode;
  const fromName = viewIdFromCountryName(country.country);
  if (fromName && fromName !== "world" && fromName !== "Other") return fromName;
  return "Other";
}

/** Always show core countries (even at 0%) and roll everything else into Other. */
function buildCountryRows(
  live: DametimeAnalyticsGeo["countries"],
  totalFans: number,
): CountryRow[] {
  const buckets = new Map<string, { count: number; flag: string; country: string }>();

  for (const featured of FEATURED_COUNTRIES) {
    buckets.set(featured.key, { count: 0, flag: featured.flag, country: featured.country });
  }

  for (const country of live) {
    const key = matchFeaturedKey(country);
    const bucket = buckets.get(key) ?? buckets.get("Other")!;
    bucket.count += country.count;
    if (key !== "Other" && country.flag) bucket.flag = country.flag;
  }

  const denominator = totalFans > 0 ? totalFans : live.reduce((sum, c) => sum + c.count, 0);

  return FEATURED_COUNTRIES.map((featured) => {
    const bucket = buckets.get(featured.key)!;
    const pct = denominator > 0 ? Math.round((bucket.count / denominator) * 1000) / 10 : 0;
    return {
      key: featured.key,
      country: featured.country,
      flag: bucket.flag || featured.flag,
      count: bucket.count,
      pct,
      countryCode: featured.codes[0],
    };
  });
}

export function AudienceDemographics() {
  const { fanAppName } = useAthlete();
  const [countries, setCountries] = useState<CountryRow[]>(() => buildCountryRows([], 0));
  const [mappedFans, setMappedFans] = useState(0);
  const [totalFans, setTotalFans] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const analytics = await fetchDametimeAnalytics();
        if (cancelled) return;
        const total = analytics.geo.totalFans ?? 0;
        setCountries(buildCountryRows(analytics.geo.countries ?? [], total));
        setMappedFans(analytics.geo.mappedFans ?? 0);
        setTotalFans(total);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load country analytics");
          setCountries(buildCountryRows([], 0));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxCount = useMemo(() => Math.max(...countries.map((c) => c.count), 1), [countries]);

  return (
    <Card title="Audience Demographics">
      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-dt-muted">Top Countries</p>
            <p className="mt-0.5 text-[11px] text-white/40">
              Live {fanAppName} fan geo
              {totalFans > 0
                ? ` · ${formatMetric(mappedFans)} of ${formatMetric(totalFans)} fans mapped`
                : " · waiting for signups"}
            </p>
          </div>
          {loading ? <Loader2 size={14} className="animate-spin text-dt-red" /> : null}
        </div>

        {error ? (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <ul className="space-y-3">
          {countries.map((country) => (
            <li key={country.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 text-[#d4d4d4]">
                  <span className="text-base">{country.flag}</span>
                  <span className="truncate">{country.country}</span>
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-white">
                  {country.pct}%
                  <span className="ml-2 font-normal text-white/40">{formatMetric(country.count)}</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-dt-border">
                <div
                  className="h-full rounded-full bg-dt-red transition-all"
                  style={{
                    width: country.count > 0 ? `${Math.max(4, (country.count / maxCount) * 100)}%` : "0%",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
