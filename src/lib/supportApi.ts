import { requireFanAppApiBase } from "./fanAppApiBase";
export type SupportReport = {
  id: string;
  fan_id: string | null;
  email: string | null;
  name: string | null;
  subject: string | null;
  message: string;
  page_url: string | null;
  created_at: string;
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

export async function fetchSupportReports(limit = 100): Promise<SupportReport[]> {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("Set VITE_ADMIN_EXPORT_SECRET to load live support reports");
  }

  const response = await fetch(
    `${getApiBase()}/api/admin/analytics?view=support&limit=${encodeURIComponent(String(limit))}`,
    { headers: { "x-admin-secret": secret } },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Support request failed (${response.status})`);
  }

  return Array.isArray((data as { reports?: SupportReport[] }).reports)
    ? (data as { reports: SupportReport[] }).reports
    : [];
}

export function supportReporterName(report: SupportReport) {
  if (report.name?.trim()) return report.name.trim();
  if (report.email?.trim()) return report.email.trim().split("@")[0];
  return "Anonymous fan";
}

export function formatSupportDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
