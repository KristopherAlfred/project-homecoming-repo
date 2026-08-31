import { useMemo, useState } from "react";
import { Check, Layers, Play, Search } from "lucide-react";
import {
  EXPERIENCE_TEMPLATES,
  type ExperienceTemplate,
} from "../../lib/experienceTemplates";
import { TEMPLATE_NAV_TABS } from "../../lib/templatePageCopy";
import { EXPERIENCE_PAGE_KEYS } from "../../lib/experienceConfig";
import { TemplateMiniPreview } from "./TemplateMiniPreview";

const FILTERS = [
  "all",
  "athlete",
  "dark",
  "light",
  "bold",
  "minimal",
  "nature",
  "sport",
  "neon",
  "urban",
  "tech",
  "vibrant",
  "pastel",
];

function pageCount(template: ExperienceTemplate) {
  return template.landing ? EXPERIENCE_PAGE_KEYS.length : 0;
}

function isAthleteTemplate(template: ExperienceTemplate) {
  return Boolean(template.athlete);
}

/**
 * "Choose a template. Make it yours." — every card is a live miniature of the
 * real landing page it applies (header, hero photo, headline, feature strip,
 * arrow CTA, members row). Preview plays the whole app; Use template loads
 * every page into the editor.
 */
export function ExperienceTemplateGallery({
  activeId,
  onApply,
  onPreview,
}: {
  activeId: string | null;
  onApply: (template: ExperienceTemplate) => void;
  onPreview?: (template: ExperienceTemplate) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const templates = useMemo(() => {
    const full = EXPERIENCE_TEMPLATES.filter((t) => t.landing);
    const looks = EXPERIENCE_TEMPLATES.filter((t) => !t.landing);
    let ordered = [...full, ...looks];
    if (filter === "athlete") ordered = ordered.filter(isAthleteTemplate);
    else if (filter !== "all") ordered = ordered.filter((t) => (t.tags ?? []).includes(filter));
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((t) =>
      `${t.label} ${t.athlete ?? ""} ${t.vibe} ${(t.tags ?? []).join(" ")}`.toLowerCase().includes(q),
    );
  }, [filter, query]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-lg font-extrabold uppercase tracking-tight text-white sm:text-2xl">
          Choose a template.{" "}
          <span style={{ color: "rgb(var(--theme-accent-rgb))" }}>Make it yours.</span>
        </h3>
        <p className="mt-1 text-[11px] text-white/50">
          Every template ships the full app — landing, home, videos, news, events, shop, impact,
          profile and more. Preview it like a fan, then edit every layer.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="w-52 rounded-full border border-white/15 bg-white/5 py-1.5 pl-7 pr-3 text-[10px] text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none"
          />
        </label>
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] transition ${
                on
                  ? "border-transparent text-black"
                  : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
              }`}
              style={on ? { background: "rgb(var(--theme-accent-rgb))" } : undefined}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {templates.map((template) => {
          const active = template.id === activeId;
          const pages = pageCount(template);
          const tabs = TEMPLATE_NAV_TABS[template.id];
          return (
            <div
              key={template.id}
              className={`group relative overflow-hidden rounded-[18px] border text-left transition ${
                active
                  ? "border-[rgb(var(--theme-accent-rgb))] shadow-[0_0_0_1px_rgba(var(--theme-accent-rgb),0.45),0_14px_40px_rgba(0,0,0,0.55)]"
                  : "border-white/10 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onApply(template)}
                className="block w-full text-left"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden">
                  {template.landing ? (
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                      <TemplateMiniPreview template={template} />
                    </div>
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center gap-3 transition-transform duration-500 group-hover:scale-[1.04]"
                      style={{
                        background: `linear-gradient(160deg, ${template.swatches[0]}, ${template.swatches[1]})`,
                      }}
                    >
                      <span
                        className="rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em]"
                        style={{
                          background: template.theme.buttonBg,
                          color: template.theme.buttonText,
                          borderRadius: template.theme.buttonRadius,
                        }}
                      >
                        Join
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.2em] text-white/40">
                        Colors only
                      </span>
                    </div>
                  )}
                  {active ? (
                    <span
                      className="absolute right-2 top-2 z-30 flex h-5 w-5 items-center justify-center rounded-full text-black"
                      style={{ background: "rgb(var(--theme-accent-rgb))" }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : null}
                  {pages ? (
                    <span className="absolute left-2 top-2 z-30 flex items-center gap-1 rounded-full bg-black/70 px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur">
                      <Layers size={9} /> {pages} pages
                    </span>
                  ) : null}
                </div>
              </button>

              <div className="space-y-2 bg-black/60 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                      {template.athlete ?? template.label}
                    </p>
                    <p className="truncate text-[8px] text-white/40">
                      {template.athlete ? `${template.label} · ${template.vibe}` : template.vibe}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-0.5">
                    {template.swatches.map((c) => (
                      <span
                        key={c}
                        className="h-2.5 w-2.5 rounded-full border border-white/20"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                {tabs ? (
                  <p className="truncate text-[8px] uppercase tracking-[0.12em] text-white/35">
                    {tabs.map((t) => t.label).join(" · ")}
                  </p>
                ) : null}
                <div className="flex gap-1.5">
                  {template.landing && onPreview ? (
                    <button
                      type="button"
                      onClick={() => onPreview(template)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full border border-white/20 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/75 transition hover:border-white/45 hover:text-white"
                    >
                      <Play size={9} /> Preview
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onApply(template)}
                    className="flex-1 rounded-full py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-black"
                    style={{ background: "rgb(var(--theme-accent-rgb))" }}
                  >
                    Use template
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
