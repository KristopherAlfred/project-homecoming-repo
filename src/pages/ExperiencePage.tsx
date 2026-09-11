import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "@/lib/router-compat";
import {
  CalendarDays,
  Eye,
  EyeOff,
  ExternalLink,
  Film,
  Gift,
  GripVertical,
  ImagePlus,
  Loader2,
  Newspaper,
  Palette,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  Undo2,
  Upload,
  LayoutTemplate,
  Wand2,
} from "lucide-react";
import {
  createWidget,
  fetchHomeLayout,
  generateHomeImage,
  getExperienceFromLayout,
  publishHomeLayout,
  resolveAssetUrl,
  withExperience,
  WIDGET_SIZES,
  widgetSpan,
  type HomeLayout,
  type HomeWidget,
  type HomeWidgetSize,
  type HomeWidgetType,
} from "../lib/homeLayoutApi";
import type {
  ExperienceConfig,
  ExperiencePageConfig,
  ExperiencePageKeyName,
  WidgetVisualStyle,
} from "../lib/experienceConfig";
import {
  createStampFromBrand,
  DEFAULT_EXPERIENCE_PAGES,
  experiencePageKeys,
  isCustomExperiencePage,
  experiencePageLabel,
  placeStampOnPage,
  widgetStyleCss,
} from "../lib/experienceConfig";
import { makeLogoBackgroundTransparent } from "../lib/logoTransparency";
import { titleTypographyStyle } from "../lib/typography";
import { TypographyControls } from "../components/TypographyControls";
import { DtSelect } from "../components/DtSelect";
import {
  ExperienceBrandPanel,
  ExperienceEffectsPanel,
  ExperiencePagePanel,
  ExperienceThemePanel,
  BrandHeaderFields,
} from "../components/experience/ExperienceAdvancedPanels";
import { ExperiencePhonePreview } from "../components/experience/ExperiencePhonePreview";
import { ExperiencePageNavigator } from "../components/experience/ExperiencePageNavigator";

import { ExperienceAppPreview } from "../components/experience/ExperienceAppPreview";
import { FanAppPublishCard } from "../components/experience/FanAppPublishCard";
import { ExperienceNavPanel } from "../components/experience/ExperienceNavPanel";
import { ExperiencePhotoLibrary } from "../components/experience/ExperiencePhotoLibrary";
import { CreatorProfilePanel } from "../components/experience/CreatorProfilePanel";
import { rememberStudioUpload } from "../lib/experiencePhotoLibrary";
import { ExperienceTemplateGallery } from "../components/experience/ExperienceTemplateGallery";
import { ExperienceAiDesigner } from "../components/experience/ExperienceAiDesigner";
import { applyExperienceTemplate, detectExperienceTemplate } from "../lib/experienceTemplates";
import { useAthlete } from "../contexts/AthleteContext";
import {
  ExperienceContentStudio,
  type ExperienceContentKind,
} from "../components/experience/ExperienceContentStudio";

type ExperienceSection =
  | "ai"
  | "templates"
  | "boxes"
  | "brand"
  | "theme"
  | "effects"
  | "nav"
  | `page:${ExperiencePageKeyName}`;

function buildSections(
  pageKeys: string[],
  pages: ExperienceConfig["pages"] | undefined,
): { id: ExperienceSection; label: string }[] {
  return [
    { id: "ai", label: "✦ AI Designer" },
    { id: "templates", label: "Templates" },
    { id: "brand", label: "Brand / Logo" },
    { id: "theme", label: "Colors" },
    { id: "effects", label: "Effects" },
    { id: "nav", label: "Tab bar" },
    ...pageKeys.map((key) => ({
      id: `page:${key}` as ExperienceSection,
      label: experiencePageLabel(pages, key),
    })),
    { id: "boxes", label: "Home boxes" },
  ];
}

/** Which fan-app page the studio is editing, if any. */
function sectionPageKey(section: ExperienceSection): ExperiencePageKeyName | null {
  return section.startsWith("page:")
    ? (section.slice(5) as ExperiencePageKeyName)
    : null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const ADD_TYPES: { type: HomeWidgetType; label: string; hint: string; Icon: typeof Ticket }[] = [
  { type: "tickets", label: "Tickets", hint: "Ticket drops", Icon: Ticket },
  { type: "custom", label: "Custom box", hint: "Any link + art", Icon: LayoutTemplate },
  { type: "videos", label: "Videos", hint: "Exclusive clips", Icon: Film },
  { type: "news", label: "News", hint: "Newsletters", Icon: Newspaper },
  { type: "events", label: "Events", hint: "Giveaways", Icon: Gift },
  { type: "music", label: "Shop", hint: "Products", Icon: Sparkles },
];

/** Mini glyph showing the box footprint inside a 2×2 grid. */
function SizeGlyph({ size }: { size: HomeWidgetSize }) {
  const span = widgetSpan(size);
  return (
    <span className="grid h-7 w-7 shrink-0 grid-cols-2 grid-rows-2 gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((cell) => {
        const col = cell % 2;
        const row = Math.floor(cell / 2);
        const filled = col < span.cols && row < span.rows;
        return (
          <span
            key={cell}
            className={`rounded-[3px] ${filled ? "bg-dt-red" : "border border-white/15 bg-white/[0.04]"}`}
          />
        );
      })}
    </span>
  );
}

const typeMeta: Record<HomeWidgetType, { label: string; Icon: typeof Ticket }> = {
  tickets: { label: "Tickets", Icon: Ticket },
  custom: { label: "Custom", Icon: LayoutTemplate },
  videos: { label: "Videos", Icon: Film },
  news: { label: "News", Icon: Newspaper },
  events: { label: "Events", Icon: CalendarDays },
  music: { label: "Shop", Icon: Sparkles },
};

type TitleFilter =
  | "as_typed"
  | "uppercase"
  | "title_case"
  | "lowercase"
  | "stacked"
  | "single_line"
  | "balanced_caps";

const TITLE_FILTERS: { id: TitleFilter; label: string; hint: string }[] = [
  { id: "as_typed", label: "As typed", hint: "Keep your wording" },
  { id: "uppercase", label: "ALL CAPS", hint: "EXCLUSIVE VIDEOS" },
  { id: "title_case", label: "Title Case", hint: "Exclusive Videos" },
  { id: "lowercase", label: "lowercase", hint: "exclusive videos" },
  { id: "stacked", label: "Stacked words", hint: "One word per line" },
  { id: "single_line", label: "Single line", hint: "No line breaks" },
  { id: "balanced_caps", label: "Balanced caps", hint: "2–3 short caps lines" },
];

function titleLines(title: string) {
  return title.split("\n");
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function applyTitleFilter(title: string, filter: TitleFilter) {
  const flat = title.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  if (!flat) return title;

  switch (filter) {
    case "as_typed":
      return title;
    case "uppercase":
      return flat.toUpperCase();
    case "title_case":
      return toTitleCase(flat);
    case "lowercase":
      return flat.toLowerCase();
    case "stacked":
      return flat
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.toUpperCase())
        .join("\n");
    case "single_line":
      return flat.toUpperCase();
    case "balanced_caps": {
      const words = flat.toUpperCase().split(/\s+/).filter(Boolean);
      if (words.length <= 2) return words.join("\n");
      if (words.length === 3) return `${words[0]}\n${words[1]}\n${words[2]}`;
      const mid = Math.ceil(words.length / 2);
      return `${words.slice(0, mid).join(" ")}\n${words.slice(mid).join(" ")}`;
    }
    default:
      return title;
  }
}

function fieldClass() {
  return "w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25";
}

function PreviewCard({ widget, selected }: { widget: HomeWidget; selected: boolean }) {
  const lines = titleLines(widget.title);
  const fit = widget.imageFit || "half";
  const titleStyle = { ...titleTypographyStyle(widget), color: widget.style?.textColor };
  const visual = widgetStyleCss(widget.style);
  const scale = (widget.imageScale ?? 100) / 100;
  const imgStyle = {
    objectFit: (widget.imageObjectFit || "contain") as "contain" | "cover",
    objectPosition: widget.imagePosition || "right bottom",
    transform: `scale(${scale})`,
    transformOrigin: "bottom right" as const,
  };
  return (
    <div
      className={`relative flex h-full min-h-[112px] overflow-hidden rounded-2xl border transition ${
        selected
          ? "border-dt-red shadow-[0_0_0_1px_rgba(var(--theme-accent-rgb),0.45),0_8px_24px_rgba(var(--theme-accent-rgb),0.18)]"
          : "border-white/10 hover:border-white/25"
      } bg-gradient-to-br from-white/[0.06] to-black/80`}
      style={visual}
    >
      {fit === "full" ? (
        <>
          {widget.imageSrc ? (
            <img
              src={resolveAssetUrl(widget.imageSrc)}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full"
              style={imgStyle}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/50 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between p-3">
            <p
              className="font-display text-[12px] font-extrabold uppercase leading-[1.05] tracking-[0.06em] text-white"
              style={titleStyle}
            >
              {lines.map((line, i) => (
                <span key={`${widget.id}-t-${i}`}>
                  {line}
                  {i < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full">
          <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
            <p
              className="font-display text-[12px] font-extrabold uppercase leading-[1.05] tracking-[0.06em] text-white"
              style={titleStyle}
            >
              {lines.map((line, i) => (
                <span key={`${widget.id}-t-${i}`}>
                  {line}
                  {i < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
          <div className="relative h-full w-[52%] shrink-0 overflow-hidden">
            {widget.imageSrc ? (
              <img
                src={resolveAssetUrl(widget.imageSrc)}
                alt=""
                draggable={false}
                className="h-full w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
                style={imgStyle}
              />
            ) : (
              <div className="flex h-full items-end justify-end p-2 text-[9px] text-white/30">Add image</div>
            )}
          </div>
        </div>
      )}
      {!widget.enabled ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-[1px]">
          <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            Hidden
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function ExperiencePage() {
  const { fanAppName, displayName, athlete } = useAthlete();
  const [layout, setLayout] = useState<HomeLayout | null>(null);
  const [section, setSection] = useState<ExperienceSection>("templates");
  const editingPageKey = sectionPageKey(section);
  const [contentStudio, setContentStudio] = useState<ExperienceContentKind | null>(null);
  /** On the Templates tab the phone preview stays hidden until a template is picked. */
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [appPreviewOpen, setAppPreviewOpen] = useState(false);
  const [templateAppPreview, setTemplateAppPreview] = useState<ExperienceConfig | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [addSize, setAddSize] = useState<HomeWidgetSize>("standard");
  const [dirty, setDirty] = useState(false);
  const [titleFilter, setTitleFilter] = useState<TitleFilter>("as_typed");
  const [history, setHistory] = useState<HomeLayout[]>([]);
  const skippingHistory = useRef(false);

  useEffect(() => {
    void fetchHomeLayout()
      .then((next) => {
        setLayout(next);
        setSelectedId(next.widgets[0]?.id ?? null);
        setHistory([]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load layout"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTitleFilter("as_typed");
  }, [selectedId]);

  const selected = useMemo(
    () => layout?.widgets.find((w) => w.id === selectedId) ?? null,
    [layout, selectedId],
  );

  const experience = useMemo(() => getExperienceFromLayout(layout), [layout]);
  const pageKeys = useMemo(() => experiencePageKeys(experience), [experience]);
  const SECTIONS = useMemo(() => buildSections(pageKeys, experience.pages), [pageKeys, experience.pages]);
  const activeTemplateId = useMemo(() => detectExperienceTemplate(experience), [experience]);

  const ordered = useMemo(
    () => (layout ? [...layout.widgets].sort((a, b) => a.order - b.order) : []),
    [layout],
  );

  const visibleCount = ordered.filter((w) => w.enabled).length;
  const canUndo = history.length > 0;

  function pushHistory(current: HomeLayout) {
    if (!skippingHistory.current) {
      setHistory((prev) => [...prev.slice(-29), structuredClone(current)]);
    }
    skippingHistory.current = false;
  }

  function updateWidgets(updater: (widgets: HomeWidget[]) => HomeWidget[]) {
    if (!layout) return;
    pushHistory(layout);
    setDirty(true);
    const widgets = updater([...layout.widgets]).map((w, index) => ({ ...w, order: index }));
    setLayout({ ...layout, widgets });
  }

  function patchExperience(updater: (prev: ExperienceConfig) => ExperienceConfig) {
    setLayout((prev) => {
      if (!prev) return prev;
      pushHistory(prev);
      const next = withExperience(prev, updater(getExperienceFromLayout(prev)));
      return next;
    });
    setDirty(true);
    setStatus("Experience updated — publish to push live");
  }

  function patchPage(pageKey: keyof ExperienceConfig["pages"], patch: Partial<ExperiencePageConfig>) {
    patchExperience((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: { ...prev.pages[pageKey], ...patch },
      },
    }));
  }

  /** Add a brand-new custom page (cloned from an existing page when given). */
  function addCustomPage(sourceKey?: string) {
    const key = `custom_${Date.now().toString(36)}`;
    patchExperience((prev) => {
      const source = sourceKey ? prev.pages[sourceKey] : undefined;
      const base = source
        ? JSON.parse(JSON.stringify(source))
        : JSON.parse(JSON.stringify(DEFAULT_EXPERIENCE_PAGES.home));
      const label = source
        ? `${experiencePageLabel(prev.pages, sourceKey!)} copy`
        : "New page";
      const order = experiencePageKeys(prev);
      const insertAt = sourceKey ? order.indexOf(sourceKey) + 1 : order.length;
      const pageOrder = [...order];
      pageOrder.splice(insertAt, 0, key);
      return {
        ...prev,
        pages: { ...prev.pages, [key]: { ...base, studioLabel: label } },
        pageOrder,
      };
    });
    setSection(`page:${key}`);
    setStatus("Page added — rename it by double-clicking its thumbnail");
  }

  function deleteCustomPage(pageKey: string) {
    if (!isCustomExperiencePage(pageKey)) return;
    patchExperience((prev) => {
      const pages = { ...prev.pages };
      delete pages[pageKey];
      return {
        ...prev,
        pages,
        pageOrder: experiencePageKeys(prev).filter((k) => k !== pageKey),
        nav: {
          ...prev.nav,
          tabs: prev.nav.tabs.filter((t) => t.pageKey !== pageKey),
        },
      };
    });
    setSection("page:home");
    setStatus("Page deleted");
  }


  async function uploadIntoExperience(
    apply: (dataUrl: string) => void,
    file: File | null,
    options?: { punchBlackBackground?: boolean },
  ) {
    if (!file) return;
    try {
      const dataUrl = options?.punchBlackBackground
        ? await makeLogoBackgroundTransparent(file)
        : await readFileAsDataUrl(file);
      apply(dataUrl);
      if (!options?.punchBlackBackground) {
        rememberStudioUpload(athlete?.id ?? null, dataUrl, file.name || "Upload");
      }
      setStatus("Image uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function undoChange() {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const nextHistory = [...prev];
      const snapshot = nextHistory.pop()!;
      skippingHistory.current = true;
      setLayout(snapshot);
      setDirty(true);
      setStatus("Reverted last change");
      if (selectedId && !snapshot.widgets.some((w) => w.id === selectedId)) {
        setSelectedId(snapshot.widgets[0]?.id ?? null);
      }
      return nextHistory;
    });
  }

  function patchSelected(patch: Partial<HomeWidget>) {
    if (!selectedId) return;
    updateWidgets((widgets) => widgets.map((w) => (w.id === selectedId ? { ...w, ...patch } : w)));
  }

  function applyFilter(filter: TitleFilter) {
    setTitleFilter(filter);
    if (!selected || filter === "as_typed") return;
    const nextTitle = applyTitleFilter(selected.title, filter);
    if (nextTitle !== selected.title) {
      patchSelected({ title: nextTitle });
      setStatus(`Applied “${TITLE_FILTERS.find((item) => item.id === filter)?.label}” to title`);
    }
  }

  function onDragStart(e: DragEvent, id: string) {
    // Required for Firefox/Safari to actually start the drag
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDragId(id);
  }

  function onDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragId && dragId !== targetId) setDropTargetId(targetId);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDropTargetId(null);
      return;
    }
    updateWidgets((widgets) => {
      const sorted = [...widgets].sort((a, b) => a.order - b.order);
      const from = sorted.findIndex((w) => w.id === dragId);
      const to = sorted.findIndex((w) => w.id === targetId);
      if (from < 0 || to < 0) return widgets;
      const [item] = sorted.splice(from, 1);
      sorted.splice(to, 0, item);
      return sorted;
    });
    setDragId(null);
    setDropTargetId(null);
    setStatus("Order updated — publish when ready");
  }

  function addWidget(type: HomeWidgetType) {
    updateWidgets((widgets) => {
      const next = createWidget(type, widgets.length, addSize);
      setSelectedId(next.id);
      return [...widgets, next];
    });
    const sizeMeta = WIDGET_SIZES.find((s) => s.id === addSize);
    setStatus(
      `Added ${typeMeta[type].label} box (${sizeMeta?.label ?? "Standard"}) — drag it on the phone to position it`,
    );
  }

  function removeSelected() {
    if (!selectedId) return;
    updateWidgets((widgets) => widgets.filter((w) => w.id !== selectedId));
    setSelectedId(null);
    setStatus("Box removed");
  }

  async function onPublish() {
    if (!layout) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const withXp = withExperience(layout, getExperienceFromLayout(layout));
      const published = await publishHomeLayout({
        ...withXp,
        version: (layout.version || 1) + 1,
        updatedAt: new Date().toISOString(),
        widgets: withXp.widgets.map((w, index) => ({ ...w, order: index })),
      });
      setLayout(published);
      setDirty(false);
      setStatus(`Published experience to ${fanAppName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  async function onGenerate() {
    if (!selectedId) return;
    setGenerating(true);
    setError(null);
    setStatus("Generating image… this can take up to a minute");
    try {
      const result = await generateHomeImage(aiPrompt);
      patchSelected({ imageSrc: result.imageSrc });
      setStatus(
        result.source === "openai"
          ? `AI image applied to the selected box${result.model ? ` (${result.model})` : ""} — publish when ready`
          : "Image applied to the selected box — publish when ready",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
      setStatus(null);
    } finally {
      setGenerating(false);
    }
  }

  function onUpload(file: File | null) {
    if (!file || !selectedId) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patchSelected({ imageSrc: reader.result });
        setStatus("Image uploaded to this box");
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading experience…
      </div>
    );
  }

  if (!layout) {
    return <div className="p-6 text-red-300">{error || "No layout found"}</div>;
  }

  const SelectedIcon = selected ? typeMeta[selected.type].Icon : LayoutTemplate;

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes exp-phone-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.55); }
          50% { box-shadow: 0 0 0 1px rgba(var(--theme-accent-rgb),0.25), 0 28px 70px rgba(var(--theme-accent-rgb),0.12); }
        }
        .exp-phone-shell { animation: exp-phone-glow 4.5s ease-in-out infinite; }
        @keyframes exp-spark {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .exp-ai-spark { animation: exp-spark 2.2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Wand2 size={12} />
                Advanced experience studio
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Customize every page of {fanAppName}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Logos, gradients, button colors, fonts, effects, landing / you&apos;re-in / settings / home boxes —
                edit here and publish live to the fan app.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Boxes</p>
                <p className="mt-1 text-lg font-bold text-white">{ordered.length}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Visible</p>
                <p className="mt-1 text-lg font-bold text-white">{visibleCount}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Status</p>
                <p className={`mt-1 text-lg font-bold ${dirty ? "text-dt-orange" : "text-dt-green"}`}>
                  {dirty ? "Unsaved" : "Synced"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAppPreviewOpen(true)}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white transition hover:border-dt-red/60"
              >
                <Eye size={16} /> Preview app
              </button>
              <button
                type="button"
                onClick={() => void onPublish()}
                disabled={saving}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Publish to app
              </button>
            </div>
          </div>
        </div>

        {(error || status || generating) && (
          <div className="space-y-2 border-b border-dt-border px-5 py-3">
            {generating ? (
              <div className="flex items-center gap-2 rounded-lg border border-dt-red/40 bg-dt-red/10 px-3 py-2 text-sm text-white">
                <Loader2 size={15} className="animate-spin text-dt-red" />
                Generating AI image for the selected box…
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            ) : null}
            {status && !generating ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {status}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-white/55">
            Pick what to edit — <span className="text-white">Landing</span>,{" "}
            <span className="text-white">You&apos;re In</span>, Settings, Brand, or Home boxes.
          </p>
          {section === "boxes" ? (
            <button
              type="button"
              onClick={() => setSection("page:landing")}
              className="text-[11px] font-semibold text-dt-red hover:underline"
            >
              Edit landing page →
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-dt-border bg-dt-card p-2">
          {SECTIONS.map((item) => {
            const active = section === item.id;
            const pk = sectionPageKey(item.id);
            const label = pk ? experiencePageLabel(experience.pages, pk) : item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setContentStudio(null);
                }}
                className={`rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                  active
                    ? "bg-dt-red text-white shadow-[0_8px_24px_rgba(var(--theme-accent-rgb),0.28)]"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {section !== "boxes" ? (
        <div
          className={`grid items-start gap-4 ${
            section === "templates"
              ? templatePreviewOpen
                ? "xl:grid-cols-[minmax(0,1fr)_300px]"
                : "grid-cols-1"
              : "xl:grid-cols-[minmax(0,1fr)_320px]"
          }`}
        >
          <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            <div className="border-b border-dt-border px-4 py-3">
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">
                {editingPageKey
                  ? experiencePageLabel(experience.pages, editingPageKey)
                  : SECTIONS.find((s) => s.id === section)?.label}
              </h3>
              <p className="text-[11px] text-white/40">Changes sync to {fanAppName} when you publish</p>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
              {section === "ai" ? (
                <ExperienceAiDesigner
                  experience={experience}
                  pageKey={editingPageKey ?? "landing"}
                  context={{
                    fanAppName,
                    athlete: displayName,
                    sport: athlete?.sport ?? undefined,
                    team: athlete?.team_or_league ?? undefined,
                  }}
                  onApply={(updater, note) => {
                    patchExperience(updater);
                    setStatus(`${note} — publish to push live`);
                  }}
                  onSetPageImage={(field, dataUrl) =>
                    patchPage(editingPageKey ?? "landing", { [field]: dataUrl })
                  }
                  onStatus={(message) => setStatus(message)}
                  onError={(message) => setError(message)}
                />
              ) : null}
              {section === "templates" ? (
                <ExperienceTemplateGallery
                  activeId={activeTemplateId}
                  onApply={(template) => {
                    patchExperience((prev) => applyExperienceTemplate(prev, template));
                    setTemplatePreviewOpen(true);
                    setStatus(`${template.label} template applied — publish to push live`);
                  }}
                  onPreview={(template) =>
                    setTemplateAppPreview(applyExperienceTemplate(experience, template))
                  }
                />
              ) : null}

              {section === "brand" ? (
                <ExperienceBrandPanel
                  brand={experience.brand}
                  onChange={(patch) =>
                    patchExperience((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }))
                  }
                  onUploadLogo={(file) =>
                    void uploadIntoExperience(
                      (logoSrc) =>
                        patchExperience((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, logoSrc, showLogoImage: true, logoTint: true },
                        })),
                      file,
                      { punchBlackBackground: true },
                    )
                  }
                  onSaveLogoStamp={() => {
                    const stamp = createStampFromBrand(experience.brand);
                    if (!stamp) {
                      setStatus("Pick a logo first, then save it as a stamp");
                      return;
                    }
                    patchExperience((prev) => {
                      if ((prev.stamps || []).some((s) => s.src === stamp.src)) return prev;
                      return { ...prev, stamps: [...(prev.stamps || []), stamp] };
                    });
                    setStatus("Logo saved — click it on any page to place it");
                  }}
                />
              ) : null}
              {section === "theme" ? (
                <ExperienceThemePanel
                  theme={experience.theme}
                  onChange={(patch) =>
                    patchExperience((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }))
                  }
                />
              ) : null}
              {section === "effects" ? (
                <ExperienceEffectsPanel
                  effects={experience.effects}
                  onChange={(patch) =>
                    patchExperience((prev) => ({ ...prev, effects: { ...prev.effects, ...patch } }))
                  }
                />
              ) : null}
              {section === "nav" ? (
                <ExperienceNavPanel
                  nav={experience.nav}
                  pages={experience.pages}
                  onChange={(patch) =>
                    patchExperience((prev) => ({ ...prev, nav: { ...prev.nav, ...patch } }))
                  }
                />
              ) : null}
              {editingPageKey === "landing" && experience.creator?.enabled !== false ? (
                <CreatorProfilePanel
                  creator={experience.creator}
                  onChange={(patch) =>
                    patchExperience((prev) => ({ ...prev, creator: { ...prev.creator, ...patch } }))
                  }
                  onUpload={(file, apply) => void uploadIntoExperience(apply, file)}
                />
              ) : null}
              {editingPageKey && !(editingPageKey === "landing" && experience.creator?.enabled !== false) ? (
                <div className="mb-4">
                  <ExperiencePhotoLibrary
                    pageLabel={experiencePageLabel(experience.pages, editingPageKey)}
                    onApply={(slot, src) => {
                      patchPage(editingPageKey, { [slot]: src });
                      setStatus(`Photo applied to ${slot === "heroImage" ? "hero" : slot === "backgroundImage" ? "background" : "title art"}`);
                    }}
                    onUpload={(file) =>
                      void uploadIntoExperience((dataUrl) => {
                        patchPage(editingPageKey, { heroImage: dataUrl });
                      }, file)
                    }
                  />
                </div>
              ) : null}
              {editingPageKey && !(editingPageKey === "landing" && experience.creator?.enabled !== false) ? (
                <ExperiencePagePanel
                  pageKey={editingPageKey}
                  page={experience.pages[editingPageKey]}
                  brand={experience.brand}
                  onChangeBrand={(patch) =>
                    patchExperience((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }))
                  }
                  onChange={(patch) => patchPage(editingPageKey, patch)}
                  onUpload={(field, file) =>
                    void uploadIntoExperience((dataUrl) => {
                      patchPage(editingPageKey, { [field]: dataUrl });
                    }, file)
                  }
                />
              ) : null}
            </div>
          </section>
          {section === "templates" && !templatePreviewOpen ? null : (
          <div className="flex flex-col gap-3">
          <FanAppPublishCard athleteId={athlete?.id ?? null} appName={fanAppName} experience={experience} />
          <ExperiencePageNavigator
            experience={experience}
            activePageKey={editingPageKey}
            onSelect={(key) => setSection(`page:${key}`)}
            onPlay={() => setAppPreviewOpen(true)}
            onRename={(key, label) => patchPage(key, { studioLabel: label })}
            onAddPage={() => addCustomPage()}
            onDuplicatePage={(key) => addCustomPage(key)}
            onDeletePage={(key) => deleteCustomPage(key)}
          />
          <ExperiencePhonePreview
            experience={experience}

            mode={editingPageKey ? "page" : "theme"}
            label={editingPageKey ? experiencePageLabel(experience.pages, editingPageKey) : undefined}
            pageKey={editingPageKey ?? "landing"}
            onPatchBrand={(patch) =>
              patchExperience((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }))
            }
            onPatchPage={(patch) => patchPage(editingPageKey ?? "landing", patch)}
            onPatchCreator={(patch) =>
              patchExperience((prev) => ({ ...prev, creator: { ...prev.creator, ...patch } }))
            }
            onUploadMedia={(file, apply) => void uploadIntoExperience(apply, file)}
            onSaveLogo={() => {
              const stamp = createStampFromBrand(experience.brand);
              if (!stamp) {
                setStatus("Pick a logo first, then save it as a stamp");
                return;
              }
              patchExperience((prev) => {
                if ((prev.stamps || []).some((s) => s.src === stamp.src)) {
                  return prev;
                }
                return { ...prev, stamps: [...(prev.stamps || []), stamp] };
              });
              setStatus("Logo saved — click it on any page to place it");
            }}
            onPlaceStamp={(stampId) => {
              const pageKey = editingPageKey ?? "landing";
              const stamp = (experience.stamps || []).find((s) => s.id === stampId);
              if (!stamp) return;
              patchPage(pageKey, {
                layoutMode: "freeform",
                stage: placeStampOnPage(experience.pages[pageKey], stamp),
              });
              setStatus(`Placed logo on ${experiencePageLabel(experience.pages, pageKey)}`);
            }}
            onRemoveStamp={(stampId) => {
              patchExperience((prev) => ({
                ...prev,
                stamps: (prev.stamps || []).filter((s) => s.id !== stampId),
                pages: Object.fromEntries(
                  Object.entries(prev.pages).map(([key, page]) => [
                    key,
                    {
                      ...page,
                      stage: (page.stage || []).filter((item) => item.stampId !== stampId),
                    },
                  ]),
                ) as typeof prev.pages,
              }));
            }}
          />
          </div>
          )}

        </div>
      ) : null}

      {section === "boxes" && contentStudio ? (
        <ExperienceContentStudio
          kind={contentStudio}
          onBack={() => setContentStudio(null)}
          page={
            contentStudio === "videos"
              ? experience.pages.videos
              : contentStudio === "news"
                ? experience.pages.news
                : experience.pages.docAndGlo
          }
          onPatchPage={(patch) =>
            patchPage(
              contentStudio === "videos" ? "videos" : contentStudio === "news" ? "news" : "docAndGlo",
              patch,
            )
          }
        />
      ) : null}

      {section === "boxes" && !contentStudio ? (
      <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)_minmax(400px,440px)]">
        {/* Left: Home boxes + AI studio */}
        <div className="flex min-w-0 flex-col gap-4">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="flex items-center justify-between border-b border-dt-border px-4 py-3">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Home boxes</h3>
              <p className="text-[11px] text-white/40">Drag to reorder fan home</p>
            </div>
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] text-white/70">
              <input
                type="checkbox"
                checked={layout.heroEnabled}
                onChange={(e) => {
                  setHistory((prev) => [...prev.slice(-29), structuredClone(layout)]);
                  setDirty(true);
                  setLayout({ ...layout, heroEnabled: e.target.checked });
                }}
                className="accent-dt-red"
              />
              Hero
            </label>
          </div>

          <div className="border-b border-dt-border p-3">
            <BrandHeaderFields
              brand={experience.brand}
              onChange={(patch) =>
                patchExperience((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }))
              }
            />
          </div>

          <ul className="space-y-2 p-3">
            {ordered.map((widget, index) => {
              const Meta = typeMeta[widget.type];
              const isSelected = selectedId === widget.id;
              const isDragging = dragId === widget.id;
              const isDrop = dropTargetId === widget.id && dragId !== widget.id;
              return (
                <li
                  key={widget.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, widget.id)}
                  onDragOver={(e) => onDragOver(e, widget.id)}
                  onDragLeave={() => setDropTargetId((id) => (id === widget.id ? null : id))}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(widget.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropTargetId(null);
                  }}
                  onClick={() => setSelectedId(widget.id)}
                  className={`group flex cursor-grab items-center gap-2.5 rounded-xl border px-2.5 py-2.5 transition active:cursor-grabbing ${
                    isSelected
                      ? "border-dt-red/70 bg-dt-red/15 shadow-[inset_0_0_0_1px_rgba(var(--theme-accent-rgb),0.2)]"
                      : isDrop
                        ? "border-dt-red/50 bg-dt-red/10"
                        : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.04]"
                  } ${isDragging ? "opacity-45" : ""}`}
                >
                  <div className="flex h-9 w-6 shrink-0 items-center justify-center rounded-md text-white/35 group-hover:text-white/55">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white/70">
                    <Meta.Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {widget.title.replace(/\n/g, " / ")}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
                      <span>{Meta.label}</span>
                      <span className="text-white/20">·</span>
                      <span>#{index + 1}</span>
                      {!widget.enabled ? (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-dt-orange">Hidden</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-dt-border p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Add fan experience
            </p>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
              1. Pick a format
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {WIDGET_SIZES.map((sizeOption) => (
                <button
                  key={sizeOption.id}
                  type="button"
                  onClick={() => setAddSize(sizeOption.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                    addSize === sizeOption.id
                      ? "border-dt-red/70 bg-dt-red/15 shadow-[inset_0_0_0_1px_rgba(var(--theme-accent-rgb),0.25)]"
                      : "border-white/10 bg-black/25 hover:border-white/25 hover:bg-white/[0.04]"
                  }`}
                >
                  <SizeGlyph size={sizeOption.id} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-white">{sizeOption.label}</span>
                    <span className="block truncate text-[10px] text-white/40">{sizeOption.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
              2. Pick a box type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ADD_TYPES.map(({ type, label, hint, Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addWidget(type)}
                  className="group flex items-start gap-2 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent px-2.5 py-2.5 text-left transition hover:border-dt-red/40 hover:from-dt-red/10"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white/70 group-hover:border-dt-red/40 group-hover:text-dt-red">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-white">{label}</span>
                    <span className="block truncate text-[10px] text-white/40">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

          <section className="relative overflow-hidden rounded-2xl border border-dt-red/30 bg-dt-card shadow-[0_0_40px_rgba(var(--theme-accent-rgb),0.06)]">
            <div className="flex items-center gap-2.5 border-b border-white/10 bg-gradient-to-r from-dt-red/15 to-transparent px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-dt-red/20 text-dt-red">
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="exp-ai-spark" />}
              </span>
              <div>
                <h3 className="font-display text-sm font-semibold tracking-wide text-white">AI image studio</h3>
                <p className="text-[11px] text-white/45">
                  {generating
                    ? "Working… image will appear on the selected home box"
                    : "Creates art for the selected home box (uses OPENAI_API_KEY on dame-bio)"}
                </p>
              </div>
            </div>
            <div className="relative space-y-3 p-4">
              {generating ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 backdrop-blur-[2px]">
                  <Loader2 size={28} className="animate-spin text-dt-red" />
                  <p className="text-sm font-semibold text-white">Generating…</p>
                  <p className="text-center text-[11px] leading-relaxed text-white/55">
                    OpenAI is creating the image. Keep this tab open — usually 15–60 seconds.
                  </p>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-[12px] leading-relaxed text-white/55">
                {selected
                  ? `Generating for “${selected.title.replace(/\n/g, " ")}”. The result replaces this box’s image in the phone preview.`
                  : "Select a home box first, then describe the art you want."}
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                disabled={generating}
                className={fieldClass()}
                placeholder={`Example: ${displayName} action shot cutout, transparent background, mobile app tile`}
              />
              {selected?.imageSrc ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      Current box image
                    </p>
                    <p className="text-[10px] text-white/35">Also shown on phone →</p>
                  </div>
                  <div className="flex h-36 items-center justify-center bg-[radial-gradient(circle_at_center,#2a0a10,#0a0a0a)] p-3">
                    <img
                      src={resolveAssetUrl(selected.imageSrc)}
                      alt=""
                      className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void onGenerate()}
                disabled={generating || !aiPrompt.trim() || !selectedId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dt-red px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-55"
              >
                {generating ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                {generating ? "Generating…" : "Generate for this box"}
              </button>
            </div>
          </section>
        </div>

        {/* Center: phone — sticky so it stays at the top while side panels scroll */}
        <section className="relative sticky top-4 flex max-h-[calc(100vh-6rem)] items-start justify-center self-start overflow-y-auto rounded-2xl border border-dt-border bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--theme-accent-rgb),0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#070707_55%,#050505_100%)] px-4 py-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dt-red/10 to-transparent" />
          <div className="exp-phone-shell relative w-full max-w-[340px] overflow-hidden rounded-[2.35rem] border border-white/15 bg-black">
            <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black/90" />
            <div className="border-b border-white/10 bg-[#0d0d0d] px-4 pb-3 pt-8 text-center">
              <p className="mb-1 text-[8px] uppercase tracking-[0.18em] text-dt-red/90">Editable · top header</p>
              <p
                className="text-[10px] font-semibold tracking-[0.28em]"
                style={{ color: experience.brand.wordmarkColor }}
              >
                {experience.brand.wordmark || fanAppName}
              </p>
              <p className="mt-1 text-[9px]" style={{ color: experience.brand.taglineColor }}>
                {experience.brand.tagline}
              </p>
            </div>
            <div
              className="space-y-2 p-3 pb-6"
              style={{
                background: experience.theme.useGradientBg
                  ? `radial-gradient(circle at top, ${experience.theme.bgGradientVia}, ${experience.theme.bg})`
                  : experience.theme.bg,
              }}
            >
              {layout.heroEnabled ? (
                <div className="relative flex h-[118px] overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/40">
                  {experience.pages.home.heroImage ? (
                    <img
                      src={resolveAssetUrl(experience.pages.home.heroImage)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
                  <div className="relative z-10 flex h-full flex-col justify-end p-3.5">
                    <p className="font-display text-lg font-extrabold tracking-[0.12em] text-white">
                      {experience.brand.wordmark.split(" ")[0] || fanAppName.split(" ")[0]}{" "}
                      <span style={{ color: experience.theme.accent }}>LIVE</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/60">
                      {experience.pages.home.heroImage
                        ? experience.pages.home.body || "Your hub"
                        : "Upload hero art in Home header"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div
                className="grid grid-cols-2 gap-2"
                style={{ minHeight: ordered.length > 4 ? 300 : 268, gridAutoFlow: "row dense" }}
              >
                {ordered.map((widget) => {
                  const span = widgetSpan(widget.size);
                  const isDrop = dropTargetId === widget.id && dragId !== widget.id;
                  return (
                    <div
                      key={widget.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={(e) => onDragStart(e, widget.id)}
                      onDragOver={(e) => onDragOver(e, widget.id)}
                      onDragLeave={() => setDropTargetId((id) => (id === widget.id ? null : id))}
                      onDrop={(e) => {
                        e.preventDefault();
                        onDrop(widget.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropTargetId(null);
                      }}
                      onClick={() => setSelectedId(widget.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedId(widget.id);
                      }}
                      className={`relative min-h-[128px] cursor-grab select-none text-left active:cursor-grabbing ${
                        dragId === widget.id ? "opacity-45" : ""
                      } ${isDrop ? "rounded-2xl ring-2 ring-dt-red/70" : ""}`}
                      style={{
                        gridColumn: `span ${span.cols} / span ${span.cols}`,
                        gridRow: `span ${span.rows} / span ${span.rows}`,
                        minHeight: span.rows > 1 ? 128 * span.rows + 8 : 128,
                      }}
                    >
                      <PreviewCard widget={widget} selected={selectedId === widget.id} />
                      {generating && selectedId === widget.id ? (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-black/70 backdrop-blur-[1px]">
                          <Loader2 size={18} className="animate-spin text-dt-red" />
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
                            Generating…
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-white/30">
                Drag boxes to rearrange · tap to edit
              </p>
            </div>
            <div className="border-t border-white/10 bg-[#0a0a0a] px-1 pb-3 pt-2">
              <div className="grid grid-cols-5 gap-0.5">
                {(
                  [
                    { label: "HOME", active: true },
                    { label: "SOCIAL", active: false },
                    { label: "VIDEOS", active: false },
                    { label: "NEWS", active: false },
                    { label: "PROFILE", active: false },
                  ] as const
                ).map((tab) => (
                  <div key={tab.label} className="flex flex-col items-center gap-0.5 px-0.5 py-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${tab.active ? "bg-dt-red" : "bg-white/25"}`}
                      aria-hidden
                    />
                    <span
                      className={`font-display text-[7px] tracking-[0.12em] ${
                        tab.active ? "text-dt-red" : "text-white/45"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-center text-[8px] text-white/25">
                Bottom bar stays the same across the app (not edited here)
              </p>
            </div>
          </div>
        </section>

        {/* Right: edit box (larger) */}
        <section className="flex min-h-0 flex-col self-start overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            {!selected ? (
              <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/40">
                  <Plus size={22} />
                </div>
                <p className="text-sm text-white/55">Select a box to edit copy, art, and links.</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-dt-border px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dt-red/30 bg-dt-red/15 text-dt-red">
                      <SelectedIcon size={16} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-semibold tracking-wide text-white">Edit box</h3>
                      <p className="truncate text-[11px] uppercase tracking-[0.12em] text-white/40">
                        {typeMeta[selected.type].label}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={undoChange}
                      disabled={!canUndo}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:border-white/30 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35"
                      title={canUndo ? "Undo last change" : "Nothing to undo"}
                    >
                      <Undo2 size={12} /> Undo
                    </button>
                    <button
                      type="button"
                      onClick={removeSelected}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-200 transition hover:bg-red-500/10"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                <div className="space-y-4 overflow-y-auto p-5">
                  <div className="rounded-xl border border-dt-red/35 bg-dt-red/10 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dt-red">
                      When fans tap this box
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                      Set where the box goes. For Videos and News, edit the inside content right here on the phone —
                      you won’t leave Experience.
                    </p>
                    <label className="mt-3 block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                        Opens this destination
                      </span>
                      <input
                        value={selected.linkTo}
                        onChange={(e) => patchSelected({ linkTo: e.target.value })}
                        className={fieldClass()}
                        placeholder="/access/videos"
                      />
                    </label>
                    {selected.type === "news" ||
                    selected.type === "videos" ||
                    selected.type === "music" ||
                    selected.type === "events" ? (
                      selected.type === "news" || selected.type === "videos" || selected.type === "music" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setContentStudio(
                              selected.type === "news"
                                ? "news"
                                : selected.type === "videos"
                                  ? "videos"
                                  : "docAndGlo",
                            )
                          }
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dt-red/50 bg-dt-red/20 px-3 py-2.5 text-[12px] font-semibold text-dt-red hover:bg-dt-red/30"
                        >
                          <ExternalLink size={13} />
                          Edit what’s inside{" "}
                          {selected.type === "news"
                            ? "News"
                            : selected.type === "videos"
                              ? "Videos"
                              : "Shop"}{" "}
                          on the phone
                        </button>
                      ) : (
                        <Link
                          to="/content/events"
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dt-red/50 bg-dt-red/20 px-3 py-2.5 text-[12px] font-semibold text-dt-red hover:bg-dt-red/30"
                        >
                          <ExternalLink size={13} />
                          Edit what’s inside Events on the phone
                        </Link>
                      )
                    ) : (
                      <p className="mt-2 text-[11px] text-white/40">
                        Custom / tickets boxes only need a link above (app path or full URL).
                      </p>
                    )}
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                      Title <span className="normal-case tracking-normal text-white/30">(new lines OK)</span>
                    </span>
                    <textarea
                      value={selected.title}
                      onChange={(e) => {
                        setTitleFilter("as_typed");
                        patchSelected({ title: e.target.value });
                      }}
                      rows={5}
                      className={`${fieldClass()} min-h-[120px]`}
                      style={titleTypographyStyle(selected)}
                    />
                  </label>

                  <TypographyControls
                    fontFamily={selected.titleFontFamily || "default"}
                    fontSize={selected.titleFontSize || "md"}
                    onFontFamilyChange={(titleFontFamily) => patchSelected({ titleFontFamily })}
                    onFontSizeChange={(titleFontSize) => patchSelected({ titleFontSize })}
                  />

                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                      Title filter
                    </span>
                    <DtSelect
                      value={titleFilter}
                      aria-label="Title filter"
                      onChange={(value) => applyFilter(value as TitleFilter)}
                      options={TITLE_FILTERS.map((filter) => ({
                        value: filter.id,
                        label: `${filter.label} — ${filter.hint}`,
                      }))}
                    />
                    <p className="text-[11px] text-white/35">
                      Instantly restyle the title wording. Use Undo if you want the previous version back.
                    </p>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Box size</span>
                      <DtSelect
                        value={selected.size || "standard"}
                        aria-label="Box size"
                        onChange={(value) => patchSelected({ size: value as HomeWidgetSize })}
                        options={WIDGET_SIZES.map((s) => ({
                          value: s.id,
                          label: `${s.label} — ${s.hint}`,
                        }))}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Image fit</span>
                      <DtSelect
                        value={selected.imageFit || "half"}
                        aria-label="Image fit"
                        onChange={(value) => patchSelected({ imageFit: value as "half" | "full" })}
                        options={[
                          { value: "half", label: "Half" },
                          { value: "full", label: "Full bleed" },
                        ]}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                        Art size ({selected.imageScale ?? 100}%)
                      </span>
                      <input
                        type="range"
                        min={50}
                        max={160}
                        value={selected.imageScale ?? 100}
                        onChange={(e) => patchSelected({ imageScale: Number(e.target.value) })}
                        className="w-full"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Art crop</span>
                      <DtSelect
                        value={selected.imageObjectFit || "contain"}
                        aria-label="Art crop"
                        onChange={(value) =>
                          patchSelected({ imageObjectFit: value as "contain" | "cover" })
                        }
                        options={[
                          { value: "contain", label: "Contain (no crop)" },
                          { value: "cover", label: "Cover (fill)" },
                        ]}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Art position</span>
                      <DtSelect
                        value={selected.imagePosition || "right bottom"}
                        aria-label="Art position"
                        onChange={(value) => patchSelected({ imagePosition: value })}
                        options={[
                          { value: "right bottom", label: "Right bottom" },
                          { value: "right center", label: "Right center" },
                          { value: "center bottom", label: "Center bottom" },
                          { value: "center center", label: "Center" },
                          { value: "left bottom", label: "Left bottom" },
                        ]}
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => patchSelected({ enabled: !selected.enabled })}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                          selected.enabled
                            ? "border-dt-green/35 bg-dt-green/10 text-dt-green"
                            : "border-white/15 bg-black/40 text-white/60"
                        }`}
                      >
                        {selected.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                        {selected.enabled ? "Visible" : "Hidden"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Image</p>
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,#141414,#0a0a0a)]">
                      {selected.imageSrc ? (
                        <img
                          src={resolveAssetUrl(selected.imageSrc)}
                          alt=""
                          className="mx-auto h-48 w-full"
                          style={{
                            objectFit: selected.imageObjectFit || "contain",
                            objectPosition: selected.imagePosition || "center bottom",
                            transform: `scale(${(selected.imageScale ?? 100) / 100})`,
                            transformOrigin: "center bottom",
                          }}
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center text-[11px] text-white/35">
                          Upload art for this box
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/85 transition hover:bg-white/[0.08]">
                        <Upload size={14} />
                        Upload image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] text-white/40">Or image URL / path</span>
                      <input
                        value={
                          !selected.imageSrc
                            ? ""
                            : selected.imageSrc.startsWith("data:")
                              ? "(uploaded data URL)"
                              : selected.imageSrc
                        }
                        placeholder="No image yet — upload above"
                        onChange={(e) => {
                          if (!e.target.value.startsWith("(")) patchSelected({ imageSrc: e.target.value });
                        }}
                        className={fieldClass()}
                      />
                    </label>

                    <div className="space-y-3 rounded-xl border border-dt-red/25 bg-dt-red/5 p-3">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                        <Palette size={12} /> Advanced box look
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1">
                          <span className="text-[10px] text-white/40">Gradient from</span>
                          <input
                            type="color"
                            value={selected.style?.gradientFrom || "#0a1a12"}
                            onChange={(e) =>
                              patchSelected({
                                style: { ...selected.style, gradientFrom: e.target.value } as WidgetVisualStyle,
                              })
                            }
                            className="h-9 w-full cursor-pointer rounded border border-dt-border bg-transparent"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[10px] text-white/40">Gradient to</span>
                          <input
                            type="color"
                            value={selected.style?.gradientTo || "#050505"}
                            onChange={(e) =>
                              patchSelected({
                                style: { ...selected.style, gradientTo: e.target.value } as WidgetVisualStyle,
                              })
                            }
                            className="h-9 w-full cursor-pointer rounded border border-dt-border bg-transparent"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[10px] text-white/40">Text color</span>
                          <input
                            type="color"
                            value={selected.style?.textColor || "#ffffff"}
                            onChange={(e) =>
                              patchSelected({
                                style: { ...selected.style, textColor: e.target.value } as WidgetVisualStyle,
                              })
                            }
                            className="h-9 w-full cursor-pointer rounded border border-dt-border bg-transparent"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[10px] text-white/40">Effect</span>
                          <select
                            value={selected.style?.effect || "none"}
                            onChange={(e) =>
                              patchSelected({
                                style: {
                                  ...selected.style,
                                  effect: e.target.value as WidgetVisualStyle["effect"],
                                },
                              })
                            }
                            className={fieldClass()}
                          >
                            <option value="none">None</option>
                            <option value="glow">Glow</option>
                            <option value="neon">Neon</option>
                            <option value="glass">Glass</option>
                            <option value="shimmer">Shimmer</option>
                            <option value="soft">Soft</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
      </div>
      ) : null}
      {appPreviewOpen ? (
        <ExperienceAppPreview
          experience={experience}
          startPage={editingPageKey ?? "landing"}
          onClose={() => setAppPreviewOpen(false)}
        />
      ) : null}
      {templateAppPreview ? (
        <ExperienceAppPreview
          experience={templateAppPreview}
          startPage="landing"
          onClose={() => setTemplateAppPreview(null)}
        />
      ) : null}

    </div>
  );
}
