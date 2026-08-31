import { BarChart3, Bell, Home, Sparkles, Users } from "lucide-react";
import { leagueLogoUrl, type League, type Sport } from "../../lib/sportsCatalog";
import { BallIcon } from "../sports/BallIcons";

/**
 * A miniature of the athlete's dashboard, built purely from the choices made
 * during onboarding so they can confirm the look before finishing setup.
 */

type Props = {
  accent: string;
  accentText: string;
  displayName: string;
  fanAppName: string;
  headshot: string;
  sport: Sport | null;
  league: League | null;
  leagueLabel: string;
  teamLabel: string;
  role: string;
};

export function DashboardPreview({
  accent,
  accentText,
  displayName,
  fanAppName,
  headshot,
  sport,
  league,
  leagueLabel,
  teamLabel,
  role,
}: Props) {
  const logo = league ? leagueLogoUrl(league) : null;
  const initials = displayName.trim().slice(0, 1).toUpperCase() || "A";
  const navItems = [
    { icon: Home, label: "Overview", active: true },
    { icon: BarChart3, label: "Analytics" },
    { icon: Users, label: "Fans" },
    { icon: Bell, label: "Notifications" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#070707] shadow-2xl shadow-black/70">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-40 shrink-0 flex-col gap-3 border-r border-white/8 bg-black/60 p-3 sm:flex">
          <div className="flex items-center gap-2">
            {logo ? (
              <img src={logo} alt="" className="h-6 w-6 object-contain" />
            ) : (
              <BallIcon kind={sport?.ball ?? "generic"} size={22} />
            )}
            <span className="truncate text-[11px] font-semibold text-white">
              {leagueLabel || sport?.label || "Players OS"}
            </span>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px]"
                style={
                  item.active
                    ? { backgroundColor: `${accent}22`, color: accent }
                    : { color: "rgba(255,255,255,0.45)" }
                }
              >
                <item.icon size={12} />
                {item.label}
              </div>
            ))}
          </div>
          <div
            className="mt-auto rounded-lg border p-2 text-[10px] leading-snug"
            style={{ borderColor: `${accent}44`, color: "rgba(255,255,255,0.6)" }}
          >
            {teamLabel || leagueLabel || "Your team"}
            {role ? ` · ${role}` : ""}
          </div>
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{fanAppName}</p>
              <p className="truncate text-[11px] text-white/45">
                {[displayName, sport?.label, teamLabel].filter(Boolean).join(" · ")}
              </p>
            </div>
            {headshot ? (
              <img
                src={headshot}
                alt=""
                className="h-9 w-9 rounded-full border object-cover object-top"
                style={{ borderColor: `${accent}88` }}
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: accent, color: accentText }}
              >
                {initials}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Followers", value: "128.4K" },
              { label: "Fans in app", value: "3,921" },
              { label: "Engagement", value: "6.8%" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-white/40">{stat.label}</p>
                <p className="mt-0.5 text-sm font-bold" style={{ color: accent }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-end gap-1.5">
              {[38, 52, 44, 66, 58, 78, 92].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t"
                  style={{
                    height,
                    backgroundColor: accent,
                    opacity: 0.35 + index * 0.09,
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-white/40">Fan growth · last 7 days</p>
          </div>

          <div
            className="mt-3 flex items-start gap-2 rounded-xl border p-3"
            style={{ borderColor: `${accent}44`, backgroundColor: `${accent}12` }}
          >
            <Sparkles size={13} style={{ color: accent }} className="mt-0.5 shrink-0" />
            <p className="text-[11px] leading-snug text-white/70">
              AI insight: your {sport?.label?.toLowerCase() ?? "game"} highlights drive the most
              saves — post one before every {teamLabel ? `${teamLabel} game` : "game day"}.
            </p>
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-lg py-2 text-xs font-semibold"
            style={{ backgroundColor: accent, color: accentText }}
          >
            Open {fanAppName}
          </button>
        </div>
      </div>
    </div>
  );
}
