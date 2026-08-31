import { useEffect, useState, type CSSProperties } from "react";
import {
  plainFromRuns,
  syncTextRuns,
  type ExperiencePageConfig,
  type ExperienceTextRun,
} from "../../lib/experienceConfig";
import { resolveTitleFontFamily, TITLE_FONT_OPTIONS, type TitleFontFamily } from "../../lib/typography";

const NAMED_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Mint", value: "#8FE3B8" },
  { name: "Bright mint", value: "#95E4CA" },
  { name: "Gold", value: "#D4AF37" },
  { name: "Hot pink", value: "#FF2D95" },
  { name: "Pink", value: "#FF6B9D" },
  { name: "Red", value: "#ED0000" },
  { name: "Black", value: "#000000" },
  { name: "Soft gray", value: "#A3A3A3" },
] as const;

export function runsForPageField(
  page: ExperiencePageConfig,
  field: "headline" | "subhead" | "body",
): ExperienceTextRun[] {
  const plain = page[field] || "";
  const runs = field === "headline" ? page.headlineRuns : field === "subhead" ? page.subheadRuns : page.bodyRuns;
  if (runs?.length && plainFromRuns(runs) === plain) return runs;
  return syncTextRuns(plain, runs);
}

export function textRunCss(run: ExperienceTextRun, fallbackColor?: string): CSSProperties {
  const style: CSSProperties = {};
  if (run.color || fallbackColor) style.color = run.color || fallbackColor;
  if (run.fontFamily) style.fontFamily = resolveTitleFontFamily(run.fontFamily);
  if (run.fontSize) style.fontSize = `${run.fontSize}px`;
  return style;
}

export function StyledTextRuns({
  runs,
  fallbackColor,
  className,
  style,
  as: Tag = "p",
  interactive = false,
  activeIndex,
  onWordClick,
}: {
  runs: ExperienceTextRun[];
  fallbackColor?: string;
  className?: string;
  style?: CSSProperties;
  as?: "p" | "h1" | "h2" | "span" | "div";
  interactive?: boolean;
  activeIndex?: number;
  onWordClick?: (editableChipIndex: number, runIndex: number) => void;
}) {
  let editableChip = -1;
  return (
    <Tag className={className} style={style}>
      {runs.map((run, i) => {
        if (run.text === "\n") return <br key={`br-${i}`} />;
        const isWord = run.text.trim().length > 0;
        const chip = isWord ? ++editableChip : -1;
        const active = interactive && chip >= 0 && chip === activeIndex;
        if (interactive && isWord && onWordClick) {
          return (
            <button
              key={`${run.text}-${i}`}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(chip, i);
              }}
              className={`rounded-sm px-0.5 transition ${
                active ? "bg-white/20 ring-1 ring-white/50" : "hover:bg-white/10"
              }`}
              style={textRunCss(run, fallbackColor)}
            >
              {run.text}
            </button>
          );
        }
        return (
          <span key={`${run.text}-${i}`} style={textRunCss(run, fallbackColor)}>
            {run.text}
          </span>
        );
      })}
    </Tag>
  );
}

type WordStyleEditorProps = {
  label: string;
  plain: string;
  runs: ExperienceTextRun[];
  /** Preferred: one atomic update so typing doesn't get overwritten. */
  onChangeText: (plain: string, runs: ExperienceTextRun[]) => void;
  hint?: string;
  selectedChip?: number;
  onSelectedChipChange?: (chip: number) => void;
};

export function WordStyleEditor({
  label,
  plain,
  runs,
  onChangeText,
  hint,
  selectedChip: selectedChipProp,
  onSelectedChipChange,
}: WordStyleEditorProps) {
  const [draft, setDraft] = useState(plain);
  const [selectedChipLocal, setSelectedChipLocal] = useState(0);

  useEffect(() => {
    setDraft(plain);
  }, [plain]);

  const liveRuns =
    runs?.length && plainFromRuns(runs) === plain ? runs : syncTextRuns(plain, runs);
  const draftRuns = draft === plain ? liveRuns : syncTextRuns(draft, liveRuns);
  const editable = draftRuns
    .map((run, index) => ({ run, index }))
    .filter(({ run }) => run.text.trim().length > 0);

  const selectedChip = selectedChipProp ?? selectedChipLocal;
  const setSelectedChip = onSelectedChipChange ?? setSelectedChipLocal;
  const safeChip = Math.min(selectedChip, Math.max(0, editable.length - 1));
  const selectedIdx = editable[safeChip]?.index ?? -1;
  const selectedRun = selectedIdx >= 0 ? draftRuns[selectedIdx] : null;

  function commit(nextPlain: string, nextRuns: ExperienceTextRun[]) {
    setDraft(nextPlain);
    onChangeText(nextPlain, nextRuns);
  }

  function updatePlain(nextPlain: string) {
    commit(nextPlain, syncTextRuns(nextPlain, liveRuns));
  }

  function patchSelected(patch: Partial<ExperienceTextRun>) {
    if (selectedIdx < 0) return;
    const nextRuns = draftRuns.map((run, i) => (i === selectedIdx ? { ...run, ...patch } : run));
    commit(plainFromRuns(nextRuns), nextRuns);
  }

  function renameSelectedWord(nextWord: string) {
    if (selectedIdx < 0) return;
    const text = nextWord.length ? nextWord : " ";
    const nextRuns = draftRuns.map((run, i) => (i === selectedIdx ? { ...run, text } : run));
    commit(plainFromRuns(nextRuns), nextRuns);
  }

  return (
    <div
      className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</p>
      {hint ? <p className="text-[10px] text-white/40">{hint}</p> : null}

      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-dt-red">Edit the words</span>
        <textarea
          value={draft}
          onChange={(e) => updatePlain(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          rows={3}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Type here — backspace and rewrite freely"
          className="w-full resize-y rounded-md border border-white/25 bg-black px-3 py-2 text-sm text-white caret-white outline-none ring-dt-red/40 placeholder:text-white/30 focus:border-dt-red/60 focus:ring-1"
        />
        <span className="text-[10px] text-white/40">
          Change the line here, then tap a word below to style only that word.
        </span>
      </label>

      {editable.length ? (
        <>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Style one word</p>
            <div className="flex flex-wrap gap-1.5">
              {editable.map(({ run, index }, chip) => {
                const active = index === selectedIdx;
                return (
                  <button
                    key={`${run.text}-${index}`}
                    type="button"
                    onClick={() => setSelectedChip(chip)}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                      active ? "border-white/50 bg-white/15 text-white" : "border-white/10 bg-white/[0.04] text-white/70"
                    }`}
                    style={textRunCss(run)}
                  >
                    {run.text}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRun ? (
            <div className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-2.5">
              <label className="block space-y-1">
                <span className="text-[10px] text-white/40">Change “{selectedRun.text.trim() || "word"}” to</span>
                <input
                  type="text"
                  value={selectedRun.text}
                  onChange={(e) => renameSelectedWord(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  spellCheck={false}
                  className="w-full rounded-md border border-white/20 bg-black px-2.5 py-1.5 text-sm text-white caret-white outline-none focus:border-dt-red/50"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block space-y-1">
                  <span className="text-[10px] text-white/40">Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(selectedRun.color || "#FFFFFF").slice(0, 7)}
                      onChange={(e) => patchSelected({ color: e.target.value.toUpperCase() })}
                      className="h-9 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                    />
                    <select
                      value={
                        NAMED_COLORS.find((c) => c.value.toUpperCase() === (selectedRun.color || "").toUpperCase())
                          ?.value || "__custom__"
                      }
                      onChange={(e) => {
                        if (e.target.value === "__custom__") return;
                        patchSelected({ color: e.target.value });
                      }}
                      className="w-full rounded-md border border-dt-border bg-dt-bg px-2 py-1.5 text-xs text-white"
                    >
                      {NAMED_COLORS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__custom__">Custom</option>
                    </select>
                  </div>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] text-white/40">Font</span>
                  <select
                    value={selectedRun.fontFamily || "default"}
                    onChange={(e) =>
                      patchSelected({
                        fontFamily: e.target.value === "default" ? undefined : (e.target.value as TitleFontFamily),
                      })
                    }
                    className="w-full rounded-md border border-dt-border bg-dt-bg px-2 py-1.5 text-xs text-white"
                  >
                    {TITLE_FONT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] text-white/40">Size {selectedRun.fontSize || 18}px</span>
                  <input
                    type="range"
                    min={10}
                    max={48}
                    value={selectedRun.fontSize || 18}
                    onChange={(e) => patchSelected({ fontSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[10px] text-white/35">Type some words above to start styling them.</p>
      )}
    </div>
  );
}
