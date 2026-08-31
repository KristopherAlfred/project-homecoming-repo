import { useAthlete } from "../contexts/AthleteContext";
import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import {
  Bell,
  Check,
  ImagePlus,
  LogOut,
  Palette,
  PlayCircle,

  Settings2,
  Shield,
  UserRound,
} from "lucide-react";
import { saveDashboardSession } from "../lib/dashboardAuth";
import { useTheme } from "../theme/ThemeContext";
import type { ThemeTemplate } from "../theme/themes";
import { DtSelect } from "../components/DtSelect";
import { getDashboardAvatar, getDashboardAvatarRing } from "../lib/adminProfile";
import { ConnectorCards } from "../components/settings/ConnectorCards";
import { useOnboarding } from "../components/onboarding/OnboardingTour";


const TIMEZONE_OPTIONS = [
  { value: "pt", label: "Pacific Time (PT)" },
  { value: "mt", label: "Mountain Time (MT)" },
  { value: "ct", label: "Central Time (CT)" },
  { value: "et", label: "Eastern Time (ET)" },
];


const permissions = [
  { role: "Admin", publish: true, export: true, monetize: true, settings: true },
  { role: "Editor", publish: true, export: false, monetize: false, settings: false },
  { role: "Analyst", publish: false, export: true, monetize: false, settings: false },
  { role: "Viewer", publish: false, export: false, monetize: false, settings: false },
];

export function SettingsPage() {
  const { fanAppName, firstName } = useAthlete();
  const navigate = useNavigate();
  const { start: startTour } = useOnboarding();

  const { template, setTemplate, templates, palette } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [timezone, setTimezone] = useState("pt");
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  function handleSignOut() {
    saveDashboardSession(null);
    navigate("/login", { replace: true });
  }

  function flash(message: string) {
    setSavedFlash(message);
    window.setTimeout(() => setSavedFlash(null), 2200);
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background: `radial-gradient(ellipse at 12% 0%, color-mix(in srgb, ${palette.accent} 28%, transparent), transparent 52%)`,
            }}
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Settings2 size={12} />
                Settings
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Appearance, account & access
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Pick a color template, manage preferences, and see how connected platforms sync into {fanAppName}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={startTour}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-dt-red/40 bg-dt-red/10 px-5 text-sm font-semibold text-dt-red transition hover:bg-dt-red/20"
              >
                <PlayCircle size={16} />
                Play tutorial
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-dt-red/40 bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.28)] transition hover:brightness-110"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>

          </div>
        </div>

        {savedFlash ? (
          <div className="border-b border-dt-border px-5 py-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {savedFlash}
            </div>
          </div>
        ) : null}
      </div>

      <ConnectorCards />

      <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="border-b border-dt-border px-5 py-4">
          <div className="flex items-center gap-2 text-dt-red">
            <Palette size={16} />
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Color templates</h3>
          </div>
          <p className="mt-1 text-[11px] text-white/40">
            Switch the dashboard palette instantly. Branding and copy stay the same.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {templates.map((t) => {
            const active = template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemplate(t.id as ThemeTemplate);
                  flash(`Theme switched to ${t.name}`);
                }}
                className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-dt-red bg-dt-red/10 ring-1 ring-dt-red/40"
                    : "border-dt-border bg-black/25 hover:border-white/20"
                }`}
              >
                <div
                  className="mb-3 h-20 w-full rounded-xl border border-white/10"
                  style={{ background: t.preview }}
                />
                <div className="mb-2 flex gap-1.5">
                  {t.swatches.map((color) => (
                    <span
                      key={`${t.id}-${color}`}
                      className="h-5 w-5 rounded-full border border-white/15 shadow-inner"
                      style={{ background: color }}
                    />
                  ))}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-white/45">{t.description}</p>
                  </div>
                  {active ? (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dt-red text-white">
                      <Check size={13} />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border px-5 py-4">
            <div className="flex items-center gap-2 text-dt-red">
              <UserRound size={16} />
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Profile</h3>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Display details for this dashboard admin session</p>
          </div>
          <form
            className="space-y-3 p-5 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              flash("Profile preferences saved for this session");
            }}
          >
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
              <img
                src={getDashboardAvatar()}
                alt="Profile"
                className="h-12 w-12 shrink-0 rounded-full border-2 object-cover object-top"
                style={{ borderColor: getDashboardAvatarRing() }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Profile picture</p>
                <p className="text-[11px] text-white/40">Shown in the top-right corner</p>
              </div>
              <Link
                to="/profile"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-dt-red px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <ImagePlus size={13} /> Edit profile picture
              </Link>
            </div>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Display name</span>
              <input
                defaultValue={`${fanAppName} Admin`}
                className="mt-1.5 w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Email</span>
              <input
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Timezone</span>
              <div className="mt-1.5">
                <DtSelect
                  value={timezone}
                  aria-label="Timezone"
                  onChange={setTimezone}
                  options={TIMEZONE_OPTIONS}
                />
              </div>
            </label>
            <button
              type="submit"
              className="rounded-xl bg-dt-red px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Save changes
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border px-5 py-4">
            <div className="flex items-center gap-2 text-dt-red">
              <Bell size={16} />
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Preferences</h3>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Notification toggles for ops alerts</p>
          </div>
          <div className="space-y-2 p-5">
            {[
              {
                label: "Email notifications",
                hint: "Digest of publish activity and sync errors",
                checked: notifications,
                onChange: setNotifications,
              },
              {
                label: "SMS alerts for live drops",
                hint: `When ${firstName} goes live or posts exclusive content`,
                checked: smsAlerts,
                onChange: setSmsAlerts,
              },
              {
                label: "Weekly digest",
                hint: "Monday wrap of fan + content performance",
                checked: weeklyDigest,
                onChange: setWeeklyDigest,
              },
            ].map((item) => (
              <label
                key={item.label}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/25 px-3.5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-[11px] text-white/40">{item.hint}</p>
                </div>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => {
                    item.onChange(e.target.checked);
                    flash("Preferences updated");
                  }}
                  className="h-4 w-4 accent-[var(--theme-accent)]"
                />
              </label>
            ))}
          </div>
        </section>
      </div>



      <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="border-b border-dt-border px-5 py-4">
          <div className="flex items-center gap-2 text-dt-red">
            <Shield size={16} />
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Roles & permissions</h3>
          </div>
          <p className="mt-1 text-[11px] text-white/40">Reference matrix for {fanAppName} dashboard access levels</p>
        </div>
        <div className="overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-white/40">
                <th className="px-3 pb-3 pt-1 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Publish</th>
                <th className="pb-3 font-semibold">Export</th>
                <th className="pb-3 font-semibold">Monetize</th>
                <th className="pb-3 font-semibold">Settings</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.role} className="border-b border-dt-border/50 last:border-0">
                  <td className="px-3 py-3.5 font-medium text-white">{p.role}</td>
                  {[p.publish, p.export, p.monetize, p.settings].map((v, i) => (
                    <td key={i} className="py-3.5">
                      {v ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">
                          ✓
                        </span>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
