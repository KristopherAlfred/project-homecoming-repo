import { useState } from "react";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import type { ExperienceConfig, ExperiencePageKeyName } from "../../lib/experienceConfig";
import {
  experiencePageKeys,
  experiencePageLabel,
  getStageItem,
  isCustomExperiencePage,
  pageBackgroundCss,
} from "../../lib/experienceConfig";

/**
 * Page navigator strip: a tiny live thumbnail of every fan-app page in the
 * template. Click one to edit it — the phone preview and the right-hand panel
 * follow. "Play app" opens the editor-free, tap-through preview.
 */
export function ExperiencePageNavigator({
  experience,
  activePageKey,
  onSelect,
  onPlay,
  onRename,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
}: {
  experience: ExperienceConfig;
  activePageKey: ExperiencePageKeyName | null;
  onSelect: (key: ExperiencePageKeyName) => void;
  onPlay?: () => void;
  /** Rename a page (templates ship their own names; athletes can change them). */
  onRename?: (key: ExperiencePageKeyName, label: string) => void;
  onAddPage?: () => void;
  onDuplicatePage?: (key: ExperiencePageKeyName) => void;
  /** Only custom pages can be deleted. */
  onDeletePage?: (key: ExperiencePageKeyName) => void;
}) {
  const [renaming, setRenaming] = useState<ExperiencePageKeyName | null>(null);
  const pageKeys = experiencePageKeys(experience);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
          App pages · {pageKeys.length}
        </p>
        <div className="flex items-center gap-1">
          {onAddPage ? (
            <button
              type="button"
              onClick={onAddPage}
              className="flex items-center gap-1 rounded-full border border-white/20 px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/45 hover:text-white"
            >
              <Plus size={9} /> Page
            </button>
          ) : null}
          {onDuplicatePage && activePageKey ? (
            <button
              type="button"
              onClick={() => onDuplicatePage(activePageKey)}
              className="flex items-center gap-1 rounded-full border border-white/20 px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/45 hover:text-white"
            >
              <Copy size={9} /> Duplicate
            </button>
          ) : null}
          {onDeletePage && activePageKey && isCustomExperiencePage(activePageKey) ? (
            <button
              type="button"
              onClick={() => onDeletePage(activePageKey)}
              className="flex items-center gap-1 rounded-full border border-red-400/40 px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.14em] text-red-300 transition hover:border-red-400 hover:text-red-200"
            >
              <Trash2 size={9} /> Delete
            </button>
          ) : null}
          {onPlay ? (
            <button
              type="button"
              onClick={onPlay}
              className="flex items-center gap-1 rounded-full border border-white/20 px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/45 hover:text-white"
            >
              <Eye size={9} /> Play app
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pageKeys.map((key) => {
          const page = experience.pages[key];
          const active = key === activePageKey;
          const hero = getStageItem(page, "hero");
          const showHero = Boolean(page.heroImage) && !hero?.hidden;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              title={experiencePageLabel(experience.pages, key)}
              className={`group shrink-0 text-left transition ${active ? "" : "opacity-75 hover:opacity-100"}`}
            >
              <div
                className={`relative h-[74px] w-[42px] overflow-hidden rounded-lg border ${
                  active
                    ? "border-[rgb(var(--theme-accent-rgb))] shadow-[0_0_0_1px_rgba(var(--theme-accent-rgb),0.5)]"
                    : "border-white/12 group-hover:border-white/35"
                }`}
                style={{ background: pageBackgroundCss(page) }}
              >
                {showHero ? (
                  <img
                    src={page.heroImage}
                    alt=""
                    className="absolute inset-x-0 top-[16%] h-[52%] w-full object-cover opacity-90"
                  />
                ) : null}
                <span
                  className="absolute left-1 right-1 top-[72%] block h-[3px] rounded-full"
                  style={{ background: page.accentColor || experience.theme.accent }}
                />
                <span className="absolute left-1 right-1 top-[80%] block h-[2px] rounded-full bg-white/25" />
                <span
                  className="absolute inset-x-1 bottom-1 block h-[7px] rounded-full"
                  style={{ background: page.ctaBg || experience.theme.buttonBg }}
                />
              </div>
              {renaming === key ? (
                <input
                  autoFocus
                  defaultValue={experiencePageLabel(experience.pages, key)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    onRename?.(key, e.target.value.trim());
                    setRenaming(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="mt-1 w-[42px] rounded border border-white/25 bg-black px-0.5 text-center text-[7px] font-bold uppercase text-white outline-none"
                />
              ) : (
                <p
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onRename) setRenaming(key);
                  }}
                  title={onRename ? "Double-click to rename" : undefined}
                  className={`mt-1 flex w-[42px] items-center justify-center gap-[1px] truncate text-center text-[7px] font-bold uppercase tracking-[0.08em] ${
                    active ? "text-white" : "text-white/45"
                  }`}
                >
                  <span className="truncate">{experiencePageLabel(experience.pages, key)}</span>
                  {active && onRename ? <Pencil size={6} className="shrink-0 opacity-60" /> : null}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
