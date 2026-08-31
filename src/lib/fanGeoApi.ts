import { requireFanAppApiBase } from "./fanAppApiBase";
export type SignupHeatmapPoint = {
  lat: number;
  lng: number;
  count: number;
  label: string;
  countryCode?: string | null;
  countryName?: string | null;
};

export type SignupGeoStats = {
  totalFans: number;
  mappedFans: number;
  countries: { country: string; flag: string; pct: number; count: number; countryCode?: string }[];
  points: SignupHeatmapPoint[];
};

export async function fetchSignupGeoStats(): Promise<SignupGeoStats | null> {
  const base = requireFanAppApiBase();
  const secret = import.meta.env.VITE_ADMIN_EXPORT_SECRET;
  if (!secret) return null;

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/admin/geo-stats`, {
      headers: { "x-admin-secret": secret },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SignupGeoStats & { ok?: boolean };
    return {
      totalFans: data.totalFans,
      mappedFans: data.mappedFans,
      countries: data.countries,
      points: data.points,
    };
  } catch {
    return null;
  }
}
