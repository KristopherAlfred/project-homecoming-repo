import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import {
  EXPERIENCE_PAGE_KEYS,
  experiencePageKeys,
  experiencePageLabel,
  type ExperienceNav,
  type ExperienceNavTab,
  type ExperiencePageKeyName,
} from "../../lib/experienceConfig";

const ICON_CHOICES = [
  "home",
  "users",
  "video",
  "news",
  "user",
  "live",
  "shop",
  "ticket",
  "gift",
  "calendar",
  "crown",
  "star",
  "heart",
  "bolt",
  "trophy",
  "camera",
];

/** Drag-and-drop editor for the fan-app bottom tab bar. */
export function ExperienceNavPanel({
  nav,
  pages,
  onChange,
}: {
  nav: ExperienceNav;
  /** Page configs, so the page picker can show custom / template page names. */
  pages?: import("../../lib/experienceConfig").ExperiencePages;
  onChange: (patch: Partial<ExperienceNav>) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  const setTabs = (tabs: ExperienceNavTab[]) => onChange({ tabs });

  const patchTab = (id: string, patch: Partial<ExperienceNavTab>) =>
    setTabs(nav.tabs.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)));

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const next = [...nav.tabs];
    const from = next.findIndex((t) => t.id === fromId);
    const to = next.findIndex((t) => t.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setTabs(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dt-border bg-black/30 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          Tabs · drag to reorder
        </p>
        <ul className="mt-2 space-y-2">
          {nav.tabs.map((tab) => (
            <li
              key={tab.id}
              draggable
              onDragStart={() => setDragId(tab.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorder(dragId, tab.id);
                setDragId(null);
              }}
              onDragEnd={() => setDragId(null)}
              className={`flex flex-wrap items-center gap-2 rounded-lg border p-2 ${
                dragId === tab.id
                  ? "border-dt-red/60 bg-dt-red/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <GripVertical size={14} className="cursor-grab text-white/35" />
              <input
                value={tab.label}
                onChange={(e) => patchTab(tab.id, { label: e.target.value })}
                className="w-24 rounded border border-white/15 bg-black px-2 py-1 text-[11px] text-white outline-none"
              />
              <select
                value={tab.icon}
                onChange={(e) => patchTab(tab.id, { icon: e.target.value })}
                className="rounded border border-white/15 bg-black px-2 py-1 text-[11px] text-white outline-none"
              >
                {ICON_CHOICES.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <select
                value={tab.pageKey}
                onChange={(e) =>
                  patchTab(tab.id, { pageKey: e.target.value as ExperiencePageKeyName })
                }
                className="rounded border border-white/15 bg-black px-2 py-1 text-[11px] text-white outline-none"
              >
                {(pages ? experiencePageKeys({ pages }) : (EXPERIENCE_PAGE_KEYS as string[])).map((key) => (
                  <option key={key} value={key}>
                    {experiencePageLabel(pages, key)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[10px] text-white/55">
                <input
                  type="checkbox"
                  checked={!tab.hidden}
                  onChange={(e) => patchTab(tab.id, { hidden: !e.target.checked })}
                  className="accent-dt-red"
                />
                Visible
              </label>
              <button
                type="button"
                onClick={() => setTabs(nav.tabs.filter((t) => t.id !== tab.id))}
                className="ml-auto text-white/40 hover:text-dt-red"
                aria-label={`Remove ${tab.label}`}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
        {nav.tabs.length < 6 ? (
          <button
            type="button"
            onClick={() =>
              setTabs([
                ...nav.tabs,
                {
                  id: `tab_${Date.now().toString(36)}`,
                  label: "New tab",
                  icon: "star",
                  pageKey: "home",
                },
              ])
            }
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/75 hover:bg-white/[0.05]"
          >
            <Plus size={13} /> Add tab
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-xl border border-dt-border bg-black/30 p-3 sm:grid-cols-2">
        {(
          [
            ["bg", "Bar background"],
            ["borderColor", "Top border"],
            ["activeColor", "Active tab"],
            ["inactiveColor", "Inactive tab"],
          ] as const
        ).map(([field, label]) => (
          <label key={field} className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-white/45">{label}</span>
            <input
              value={nav[field]}
              onChange={(e) => onChange({ [field]: e.target.value } as Partial<ExperienceNav>)}
              className="w-full rounded border border-white/15 bg-black px-2 py-1.5 text-[11px] text-white outline-none"
            />
          </label>
        ))}
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wide text-white/45">
            Corner radius · {nav.radius}px
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={nav.radius}
            onChange={(e) => onChange({ radius: Number(e.target.value) })}
            className="w-full accent-dt-red"
          />
        </label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[11px] text-white/70">
            <input
              type="checkbox"
              checked={nav.showLabels}
              onChange={(e) => onChange({ showLabels: e.target.checked })}
              className="accent-dt-red"
            />
            Show tab labels
          </label>
          <label className="flex items-center gap-2 text-[11px] text-white/70">
            <input
              type="checkbox"
              checked={nav.hidden}
              onChange={(e) => onChange({ hidden: e.target.checked })}
              className="accent-dt-red"
            />
            Hide the whole tab bar
          </label>
        </div>
      </div>
    </div>
  );
}
