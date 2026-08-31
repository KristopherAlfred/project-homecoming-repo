import { useAthlete } from "../../contexts/AthleteContext";
import type { ReactNode } from "react";
import { TITLE_FONT_OPTIONS, type TitleFontFamily } from "../../lib/typography";
import { createCardId } from "../../lib/experienceConfig";
import type {
  ExperienceBrand,
  ExperienceCard,
  ExperienceEffects,
  ExperiencePageConfig,
  ExperiencePages,
  ExperienceTheme,
  ExperienceEffectPreset,
} from "../../lib/experienceConfig";
import {
  GRADIENT_BACKGROUND_PRESETS,
  EXPERIENCE_LOGOS,
  type ExperienceAsset,
  type GradientBackgroundPreset,
} from "../../lib/experienceAssets";
import { resolveExperiencePreviewUrl } from "../../lib/resolveExperiencePreviewUrl";
import { TintedBrandLogo } from "./TintedBrandLogo";
import { WordStyleEditor, runsForPageField } from "./StyledText";

function readImageFile(file: File | null, apply: (dataUrl: string) => void) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => apply(String(reader.result || ""));
  reader.readAsDataURL(file);
}

const CARD_ICON_CHOICES = [
  "crown",
  "video",
  "news",
  "shop",
  "star",
  "users",
  "ticket",
  "music",
  "bolt",
  "heart",
  "flame",
  "lock",
  "calendar",
  "trophy",
  "camera",
  "sparkle",
  "live",
  "home",
  "user",
];

/** Each card is an independent, reorderable component: photo, icon, title, subtitle, destination. */
function CardGridEditor({
  page,
  onChange,
}: {
  page: ExperiencePageConfig;
  onChange: (patch: Partial<ExperiencePageConfig>) => void;
}) {
  const cards = page.cards || [];

  const patchCard = (index: number, patch: Partial<ExperienceCard>) => {
    const next = cards.map((card, i) => (i === index ? { ...card, ...patch } : card));
    onChange({ cards: next });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= cards.length) return;
    const next = [...cards];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ cards: next });
  };

  return (
    <div className="space-y-3 rounded-xl border border-dt-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Feature card grid</p>
        <button
          type="button"
          onClick={() =>
            onChange({
              cards: [
                ...cards,
                {
                  id: createCardId(),
                  title: "New card",
                  subtitle: "",
                  icon: "star",
                  image: "",
                  linkPageKey: "home",
                },
              ],
            })
          }
          className="rounded-lg border border-dt-red/50 bg-dt-red/15 px-2 py-1 text-[10px] font-semibold text-dt-red"
        >
          Add card
        </button>
      </div>
      <p className="text-[11px] text-white/40">
        Every card is its own layer — photo, icon, title, subtitle and destination page.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Columns">
          <select
            value={page.cardColumns || 2}
            onChange={(e) => onChange({ cardColumns: Number(e.target.value) })}
            className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm"
          >
            <option value={1}>1 per row</option>
            <option value={2}>2 per row</option>
            <option value={3}>3 per row</option>
          </select>
        </Field>
        <Field label={`Card radius (${page.cardRadius ?? 20}px)`}>
          <input
            type="range"
            min={0}
            max={40}
            value={page.cardRadius ?? 20}
            onChange={(e) => onChange({ cardRadius: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label="Card title color">
          <ColorInput value={page.cardTitleColor || "#FFFFFF"} onChange={(cardTitleColor) => onChange({ cardTitleColor })} />
        </Field>
        <Field label="Card icon color">
          <ColorInput value={page.cardIconColor || "#8FE3B8"} onChange={(cardIconColor) => onChange({ cardIconColor })} />
        </Field>
      </div>

      {cards.length === 0 ? (
        <p className="text-[11px] text-white/35">No cards yet — add one to build the grid.</p>
      ) : null}

      {cards.map((card, index) => (
        <div key={card.id} className="space-y-2 rounded-lg border border-white/10 p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Card {index + 1}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                className="rounded border border-white/15 px-1.5 text-[10px] text-white/60"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                className="rounded border border-white/15 px-1.5 text-[10px] text-white/60"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange({ cards: cards.filter((_, i) => i !== index) })}
                className="rounded border border-white/15 px-1.5 text-[10px] text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
          <Field label="Title">
            <TextInput value={card.title} onChange={(title) => patchCard(index, { title })} />
          </Field>
          <Field label="Subtitle">
            <TextInput value={card.subtitle} onChange={(subtitle) => patchCard(index, { subtitle })} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Icon">
              <select
                value={card.icon}
                onChange={(e) => patchCard(index, { icon: e.target.value })}
                className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm"
              >
                {CARD_ICON_CHOICES.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Links to page">
              <TextInput value={card.linkPageKey} onChange={(linkPageKey) => patchCard(index, { linkPageKey })} />
            </Field>
          </div>
          <Field label="Card photo URL">
            <TextInput value={card.image} onChange={(image) => patchCard(index, { image })} />
          </Field>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-[10px] text-white/60"
            onChange={(e) => readImageFile(e.target.files?.[0] ?? null, (image) => patchCard(index, { image }))}
          />
        </div>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
      {children}
      {hint ? <span className="block text-[10px] text-white/35">{hint}</span> : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none focus:border-dt-red/50 ${className}`}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const NAMED_COLORS = [
    { name: "White", value: "#FFFFFF" },
    { name: "Soft white", value: "#F5F5F5" },
    { name: "Mint", value: "#8FE3B8" },
    { name: "Bright mint", value: "#95E4CA" },
    { name: "Deep green", value: "#04140C" },
    { name: "Black", value: "#000000" },
    { name: "Charcoal", value: "#1A1A1A" },
    { name: "Gold", value: "#D4AF37" },
    { name: "Hot pink", value: "#FF2D95" },
    { name: "Pink", value: "#FF6B9D" },
    { name: "Red", value: "#ED0000" },
  ] as const;

  const normalized = (value || "").trim().toUpperCase();
  const matched = NAMED_COLORS.find((c) => c.value.toUpperCase() === normalized);
  const selectValue = matched?.value ?? "__custom__";

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value?.startsWith("#") && value.length >= 7 ? value.slice(0, 7) : "#8FE3B8"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-10 w-12 cursor-pointer rounded border border-dt-border bg-transparent"
        title="Pick a color"
      />
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === "__custom__") return;
          onChange(e.target.value);
        }}
        className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none focus:border-white/40"
      >
        {NAMED_COLORS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.name}
          </option>
        ))}
        <option value="__custom__">{matched ? "Custom…" : `Custom (${normalized || "—"})`}</option>
      </select>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
        checked ? "border-dt-red/50 bg-dt-red/10 text-white" : "border-dt-border bg-dt-bg/40 text-white/70"
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${checked ? "text-dt-red" : "text-white/35"}`}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

function FontSelect({
  value,
  onChange,
}: {
  value?: TitleFontFamily;
  onChange: (value: TitleFontFamily) => void;
}) {
  return (
    <select
      value={value || "default"}
      onChange={(e) => onChange(e.target.value as TitleFontFamily)}
      className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none"
    >
      {TITLE_FONT_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function AssetPicker({
  label,
  assets,
  value,
  onSelect,
  allowClear = true,
  aspect = "square",
}: {
  label: string;
  assets: ExperienceAsset[];
  value: string;
  onSelect: (src: string) => void;
  allowClear?: boolean;
  aspect?: "square" | "wide";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</p>
        {allowClear ? (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-[10px] font-semibold uppercase tracking-wide text-white/40 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {assets.map((asset) => {
          const active = value === asset.src;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.src)}
              className={`overflow-hidden rounded-xl border text-left transition ${
                active
                  ? "border-dt-red ring-2 ring-dt-red/40"
                  : "border-dt-border hover:border-white/30"
              }`}
            >
              <div
                className={`bg-black/50 ${aspect === "wide" ? "aspect-[16/10]" : "aspect-square"}`}
              >
                <img
                  src={resolveExperiencePreviewUrl(asset.src)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate px-2 py-1.5 text-[10px] text-white/70">{asset.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GradientBackgroundPicker({
  label,
  onSelect,
  selectedId,
}: {
  label: string;
  onSelect: (preset: GradientBackgroundPreset) => void;
  selectedId?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</p>
      <p className="text-[11px] text-white/40">
        CSS gradients — responsive on every phone size, no upload needed.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {GRADIENT_BACKGROUND_PRESETS.map((preset) => {
          const active = selectedId === preset.id;
          const swatch = preset.useGradientBg
            ? `linear-gradient(${preset.angle}deg, ${preset.backgroundGradientFrom}, ${preset.backgroundGradientVia}, ${preset.backgroundGradientTo})`
            : preset.backgroundColor;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={`overflow-hidden rounded-xl border text-left transition ${
                active ? "border-dt-red ring-2 ring-dt-red/40" : "border-dt-border hover:border-white/30"
              }`}
            >
              <div className="aspect-[4/5] w-full" style={{ background: swatch }} />
              <p className="truncate px-2 py-1.5 text-[10px] text-white/75">{preset.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const EFFECT_OPTIONS: { id: ExperienceEffectPreset; label: string }[] = [
  { id: "none", label: "None" },
  { id: "soft", label: "Soft wash" },
  { id: "glow", label: "Glow" },
  { id: "neon", label: "Neon" },
  { id: "glass", label: "Glass" },
  { id: "shimmer", label: "Shimmer" },
  { id: "burst", label: "Burst" },
  { id: "rays", label: "Rays" },
];

export function BrandHeaderFields({
  brand,
  onChange,
}: {
  brand: ExperienceBrand;
  onChange: (patch: Partial<ExperienceBrand>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
          Top header · wordmark & tagline
        </p>
        <p className="mt-1 text-[11px] text-white/45">
          Edit the bar at the top of the phone. Same brand on every screen.
        </p>
      </div>
      <Field label="Wordmark (title)">
        <TextInput value={brand.wordmark} onChange={(wordmark) => onChange({ wordmark })} />
      </Field>
      <Field label="Wordmark color">
        <ColorInput value={brand.wordmarkColor} onChange={(wordmarkColor) => onChange({ wordmarkColor })} />
      </Field>
      <Field label="Tagline">
        <TextInput value={brand.tagline} onChange={(tagline) => onChange({ tagline })} />
      </Field>
      <Field label="Tagline color">
        <ColorInput value={brand.taglineColor} onChange={(taglineColor) => onChange({ taglineColor })} />
      </Field>
    </div>
  );
}

export function ExperienceBrandPanel({
  brand,
  onChange,
  onUploadLogo,
  onSaveLogoStamp,
}: {
  brand: ExperienceBrand;
  onChange: (patch: Partial<ExperienceBrand>) => void;
  onUploadLogo: (file: File | null) => void;
  onSaveLogoStamp?: () => void;
}) {
  return (
    <div className="space-y-4">
      <BrandHeaderFields brand={brand} onChange={onChange} />

      <div className="rounded-xl border border-dt-border bg-black/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dt-red">Live logo preview</p>
        <div className="flex items-center gap-3">
          {brand.showLogoImage && brand.logoSrc ? (
            <TintedBrandLogo
              src={resolveExperiencePreviewUrl(brand.logoSrc)}
              color={brand.logoColor}
              tint={brand.logoTint !== false}
              size={48}
            />
          ) : null}
          <div>
            <p className="font-display text-xl tracking-wide" style={{ color: brand.wordmarkColor }}>
              {brand.wordmark || "WORDMARK"}
            </p>
            <p className="text-xs" style={{ color: brand.taglineColor }}>
              {brand.tagline || "Tagline under logo"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-white/45">
          On the phone, drag the logo, wordmark, and tagline separately. Save the logo as a stamp to drop it on any page.
        </p>
        {onSaveLogoStamp ? (
          <button
            type="button"
            onClick={onSaveLogoStamp}
            disabled={!brand.logoSrc}
            className="mt-3 rounded-lg border border-dt-red/50 bg-dt-red/15 px-3 py-2 text-xs font-semibold text-dt-red disabled:opacity-40"
          >
            Save logo as stamp
          </button>
        ) : null}
      </div>

      <Toggle
        checked={brand.showLogoImage}
        onChange={(showLogoImage) => onChange({ showLogoImage })}
        label="Show logo image"
      />

      <AssetPicker
        label="Pick a starter logo"
        assets={EXPERIENCE_LOGOS}
        value={brand.logoSrc}
        onSelect={(logoSrc) => onChange({ logoSrc, showLogoImage: Boolean(logoSrc), logoTint: true })}
      />

      <Field label="Logo image URL" hint="Or upload your own mark">
        <TextInput value={brand.logoSrc} onChange={(logoSrc) => onChange({ logoSrc })} />
      </Field>
      <Field label="Upload logo" hint="PNG with transparency works best — black backgrounds are cleared automatically">
        <input
          type="file"
          accept="image/png,image/webp,image/svg+xml,image/*"
          onChange={(e) => onUploadLogo(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-white/70"
        />
      </Field>
      <Toggle
        checked={brand.logoTint !== false}
        onChange={(logoTint) => onChange({ logoTint })}
        label="Tint logo with color below"
      />
      <Field label="Logo color" hint="Recolors transparent marks (turn tint off for full-color photos)">
        <ColorInput value={brand.logoColor} onChange={(logoColor) => onChange({ logoColor })} />
      </Field>
      <Field label="Wordmark font">
        <FontSelect
          value={brand.wordmarkFontFamily}
          onChange={(wordmarkFontFamily) => onChange({ wordmarkFontFamily })}
        />
      </Field>
    </div>
  );
}

export function ExperienceThemePanel({
  theme,
  onChange,
}: {
  theme: ExperienceTheme;
  onChange: (patch: Partial<ExperienceTheme>) => void;
}) {
  return (
    <div className="space-y-5">
      <GradientBackgroundPicker
        label="App background gradients"
        onSelect={(preset) =>
          onChange({
            bg: preset.backgroundColor,
            bgGradientFrom: preset.backgroundGradientFrom,
            bgGradientVia: preset.backgroundGradientVia,
            bgGradientTo: preset.backgroundGradientTo,
            useGradientBg: preset.useGradientBg,
            bgGradientAngle: preset.angle,
            backgroundImage: "",
          })
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Toggle
          checked={theme.useGradientBg}
          onChange={(useGradientBg) => onChange({ useGradientBg, ...(useGradientBg ? { backgroundImage: "" } : {}) })}
          label="Gradient background"
        />
        <Field label="Gradient angle">
          <input
            type="range"
            min={0}
            max={360}
            value={theme.bgGradientAngle}
            onChange={(e) => onChange({ bgGradientAngle: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label="BG solid">
          <ColorInput value={theme.bg} onChange={(bg) => onChange({ bg })} />
        </Field>
        <Field label="Gradient from">
          <ColorInput value={theme.bgGradientFrom} onChange={(bgGradientFrom) => onChange({ bgGradientFrom })} />
        </Field>
        <Field label="Gradient via">
          <ColorInput value={theme.bgGradientVia} onChange={(bgGradientVia) => onChange({ bgGradientVia })} />
        </Field>
        <Field label="Gradient to">
          <ColorInput value={theme.bgGradientTo} onChange={(bgGradientTo) => onChange({ bgGradientTo })} />
        </Field>
        <Field label="Accent">
          <ColorInput value={theme.accent} onChange={(accent) => onChange({ accent })} />
        </Field>
        <Field label="Accent hover">
          <ColorInput value={theme.accentHover} onChange={(accentHover) => onChange({ accentHover })} />
        </Field>
        <Field label="Button background">
          <ColorInput value={theme.buttonBg} onChange={(buttonBg) => onChange({ buttonBg })} />
        </Field>
        <Field label="Button text">
          <ColorInput value={theme.buttonText} onChange={(buttonText) => onChange({ buttonText })} />
        </Field>
        <Field label="Button border">
          <ColorInput value={theme.buttonBorder} onChange={(buttonBorder) => onChange({ buttonBorder })} />
        </Field>
        <Field label="Button radius">
          <input
            type="range"
            min={0}
            max={40}
            value={theme.buttonRadius}
            onChange={(e) => onChange({ buttonRadius: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label="Text">
          <ColorInput value={theme.text} onChange={(text) => onChange({ text })} />
        </Field>
        <Field label="Muted text">
          <ColorInput value={theme.muted} onChange={(muted) => onChange({ muted })} />
        </Field>
        <Field label="Card">
          <ColorInput value={theme.card} onChange={(card) => onChange({ card })} />
        </Field>
        <Field label="Surface">
          <ColorInput value={theme.surface} onChange={(surface) => onChange({ surface })} />
        </Field>
        <Field label="Display font">
          <FontSelect value={theme.fontDisplay} onChange={(fontDisplay) => onChange({ fontDisplay })} />
        </Field>
        <Field label="Body font">
          <FontSelect value={theme.fontBody} onChange={(fontBody) => onChange({ fontBody })} />
        </Field>
      </div>
    </div>
  );
}

export function ExperienceEffectsPanel({
  effects,
  onChange,
}: {
  effects: ExperienceEffects;
  onChange: (patch: Partial<ExperienceEffects>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle checked={effects.glow} onChange={(glow) => onChange({ glow })} label="Glow" />
        <Toggle checked={effects.particles} onChange={(particles) => onChange({ particles })} label="Particles" />
        <Toggle checked={effects.noise} onChange={(noise) => onChange({ noise })} label="Film noise" />
        <Toggle checked={effects.shimmer} onChange={(shimmer) => onChange({ shimmer })} label="Shimmer" />
        <Toggle checked={effects.blurBackdrop} onChange={(blurBackdrop) => onChange({ blurBackdrop })} label="Blur backdrop" />
        <Toggle checked={effects.vignette} onChange={(vignette) => onChange({ vignette })} label="Vignette" />
        <Toggle
          checked={effects.animatedGradient}
          onChange={(animatedGradient) => onChange({ animatedGradient })}
          label="Animated gradient"
        />
        <Toggle
          checked={effects.glassmorphism}
          onChange={(glassmorphism) => onChange({ glassmorphism })}
          label="Glassmorphism"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Glow color">
          <ColorInput value={effects.glowColor} onChange={(glowColor) => onChange({ glowColor })} />
        </Field>
        <Field label={`Glow intensity (${effects.glowIntensity})`}>
          <input
            type="range"
            min={0}
            max={100}
            value={effects.glowIntensity}
            onChange={(e) => onChange({ glowIntensity: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label="Particle color">
          <ColorInput value={effects.particleColor} onChange={(particleColor) => onChange({ particleColor })} />
        </Field>
        <Field label={`Noise opacity (${effects.noiseOpacity})`}>
          <input
            type="range"
            min={0}
            max={40}
            value={effects.noiseOpacity}
            onChange={(e) => onChange({ noiseOpacity: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      </div>
    </div>
  );
}

export function ExperiencePagePanel({
  pageKey,
  page,
  onChange,
  onUpload,
  brand,
  onChangeBrand,
}: {
  pageKey: keyof ExperiencePages;
  page: ExperiencePageConfig;
  onChange: (patch: Partial<ExperiencePageConfig>) => void;
  onUpload: (field: "backgroundImage" | "heroImage" | "titleImage", file: File | null) => void;
  brand?: ExperienceBrand;
  onChangeBrand?: (patch: Partial<ExperienceBrand>) => void;
}) {
  const { fanAppName } = useAthlete();
  return (
    <div className="space-y-4">
      {brand && onChangeBrand ? <BrandHeaderFields brand={brand} onChange={onChangeBrand} /> : null}
      <p className="text-xs text-white/45">
        {pageKey === "home" ? (
          <>
            <span className="text-dt-red">Home header</span> — LIVE hero art, home background, and header copy.
            Box images and grid order live under <span className="text-white/70">Home boxes</span>.
          </>
        ) : pageKey === "settings" ? (
          <>
            <span className="text-dt-red">Account Settings</span> — default settings screen layout fans see inside
            the app. Edit title, logout label, and colors here.
          </>
        ) : (
          <>
            Editing <span className="text-dt-red">{pageKey}</span> — publish to push live into {fanAppName}.
          </>
        )}
      </p>

      <GradientBackgroundPicker
        label="Page background gradients"
        onSelect={(preset) =>
          onChange({
            backgroundColor: preset.backgroundColor,
            backgroundGradientFrom: preset.backgroundGradientFrom,
            backgroundGradientTo: preset.backgroundGradientTo,
            useGradientBg: preset.useGradientBg,
            backgroundImage: "",
          })
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Toggle
          checked={page.useGradientBg}
          onChange={(useGradientBg) => onChange({ useGradientBg, backgroundImage: useGradientBg ? "" : page.backgroundImage })}
          label="Page gradient background"
        />
        <Field label="Effect preset">
          <select
            value={page.effectPreset}
            onChange={(e) => onChange({ effectPreset: e.target.value as ExperienceEffectPreset })}
            className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm"
          >
            {EFFECT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Background">
          <ColorInput value={page.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />
        </Field>
        <Field label="Accent">
          <ColorInput value={page.accentColor} onChange={(accentColor) => onChange({ accentColor })} />
        </Field>
        <Field label="Gradient from">
          <ColorInput
            value={page.backgroundGradientFrom}
            onChange={(backgroundGradientFrom) => onChange({ backgroundGradientFrom })}
          />
        </Field>
        <Field label="Gradient to">
          <ColorInput
            value={page.backgroundGradientTo}
            onChange={(backgroundGradientTo) => onChange({ backgroundGradientTo })}
          />
        </Field>
        <Field label="CTA background">
          <ColorInput value={page.ctaBg} onChange={(ctaBg) => onChange({ ctaBg })} />
        </Field>
        <Field label="CTA text color">
          <ColorInput value={page.ctaText} onChange={(ctaText) => onChange({ ctaText })} />
        </Field>
      </div>

      <WordStyleEditor
        label="Headline · style each word"
        hint="Type the line, then tap a word (e.g. GLO) to change only that word’s color, font, or size"
        plain={page.headline}
        runs={runsForPageField(page, "headline")}
        onChangeText={(headline, headlineRuns) => onChange({ headline, headlineRuns })}
      />
      <WordStyleEditor
        label="Subhead · style each word"
        hint="Use Enter for line breaks in the text box"
        plain={page.subhead}
        runs={runsForPageField(page, "subhead")}
        onChangeText={(subhead, subheadRuns) => onChange({ subhead, subheadRuns })}
      />
      <WordStyleEditor
        label="Body · style each word"
        plain={page.body}
        runs={runsForPageField(page, "body")}
        onChangeText={(body, bodyRuns) => onChange({ body, bodyRuns })}
      />
      <Field label="CTA label">
        <TextInput value={page.ctaLabel} onChange={(ctaLabel) => onChange({ ctaLabel })} />
      </Field>

      {pageKey === "landing" ? (
        <div className="space-y-3 rounded-xl border border-dt-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
            Landing social proof · Follow me
          </p>
          <Field label="Fans box title">
            <TextInput
              value={page.fansProofTitle || ""}
              onChange={(fansProofTitle) => onChange({ fansProofTitle })}
            />
          </Field>
          <Field label="Fans box body">
            <TextInput
              value={page.fansProofBody || ""}
              onChange={(fansProofBody) => onChange({ fansProofBody })}
            />
          </Field>
          <Field label="Follow section title">
            <TextInput value={page.followTitle || ""} onChange={(followTitle) => onChange({ followTitle })} />
          </Field>
          <Field label="Footer line" hint='Tip: put GLO in caps — it renders hot pink on the app'>
            <TextInput value={page.footerLine || ""} onChange={(footerLine) => onChange({ footerLine })} />
          </Field>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Social stats row</p>
            {(page.landingSocials || []).map((stat, index) => (
              <div key={stat.id} className="grid gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-4">
                <Field label={`${stat.icon} count`}>
                  <TextInput
                    value={stat.count}
                    onChange={(count) => {
                      const landingSocials = [...(page.landingSocials || [])];
                      landingSocials[index] = { ...landingSocials[index], count };
                      onChange({ landingSocials });
                    }}
                  />
                </Field>
                <Field label="Unit">
                  <TextInput
                    value={stat.unit}
                    onChange={(unit) => {
                      const landingSocials = [...(page.landingSocials || [])];
                      landingSocials[index] = { ...landingSocials[index], unit };
                      onChange({ landingSocials });
                    }}
                  />
                </Field>
                <Field label="URL" hint="Opens from the landing strip">
                  <TextInput
                    value={stat.url}
                    onChange={(url) => {
                      const landingSocials = [...(page.landingSocials || [])];
                      landingSocials[index] = { ...landingSocials[index], url };
                      onChange({ landingSocials });
                    }}
                    className="font-mono text-[11px]"
                  />
                </Field>
                <div className="flex items-end pb-1 text-[10px] text-white/35">{stat.id}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pageKey === "landing" ? (
        <div className="space-y-3 rounded-xl border border-dt-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
            Join / unlock slide-in
          </p>
          <p className="text-[11px] text-white/40">
            Copy and glow for the Continue with X / Google / Apple panel. Social buttons are mocked in the
            fan app for now — they just let fans in.
          </p>
          <Field label="Unlock headline">
            <TextInput
              value={page.unlockHeadline || ""}
              onChange={(unlockHeadline) => onChange({ unlockHeadline })}
            />
          </Field>
          <Field label="Unlock body">
            <textarea
              value={page.unlockBody || ""}
              onChange={(e) => onChange({ unlockBody: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none"
            />
          </Field>
          <Field label="Unlock footer">
            <TextInput
              value={page.unlockFooter || ""}
              onChange={(unlockFooter) => onChange({ unlockFooter })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Glow color">
              <ColorInput
                value={page.unlockGlowColor || "#8FE3B8"}
                onChange={(unlockGlowColor) => onChange({ unlockGlowColor })}
              />
            </Field>
            <Field label="Panel border">
              <ColorInput
                value={page.unlockPanelBorderColor || "#8C0000"}
                onChange={(unlockPanelBorderColor) => onChange({ unlockPanelBorderColor })}
              />
            </Field>
            <Field label="Panel bg from">
              <TextInput
                value={page.unlockPanelBgFrom || ""}
                onChange={(unlockPanelBgFrom) => onChange({ unlockPanelBgFrom })}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Panel bg to">
              <TextInput
                value={page.unlockPanelBgTo || ""}
                onChange={(unlockPanelBgTo) => onChange({ unlockPanelBgTo })}
                className="font-mono text-xs"
              />
            </Field>
          </div>
        </div>
      ) : null}

      {pageKey === "youreIn" ? (
        <>
          <Field label="Welcome title" hint='Shown under the checkmark — put Glo in the line for hot pink'>
            <TextInput value={page.subhead || ""} onChange={(subhead) => onChange({ subhead })} />
          </Field>
          <Field label="Loader label">
            <TextInput value={page.loaderLabel || ""} onChange={(loaderLabel) => onChange({ loaderLabel })} />
          </Field>
        </>
      ) : null}
      {pageKey === "settings" ? (
        <>
          <Field label="Settings title">
            <TextInput value={page.title || ""} onChange={(title) => onChange({ title })} />
          </Field>
          <Field label="Logout label">
            <TextInput value={page.logoutLabel || ""} onChange={(logoutLabel) => onChange({ logoutLabel })} />
          </Field>
        </>
      ) : null}

      <div className="space-y-3 rounded-xl border border-dt-border p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
          Background photo wash
        </p>
        <p className="text-[11px] text-white/40">
          The photo layer stays just a photo — this gradient sits above it so text stays readable.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Wash top">
            <TextInput
              value={page.heroOverlayFrom || ""}
              onChange={(heroOverlayFrom) => onChange({ heroOverlayFrom })}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="Wash bottom">
            <TextInput
              value={page.heroOverlayTo || ""}
              onChange={(heroOverlayTo) => onChange({ heroOverlayTo })}
              className="font-mono text-xs"
            />
          </Field>
        </div>
        <Field label={`Wash strength (${page.heroOverlayOpacity ?? 100}%)`}>
          <input
            type="range"
            min={0}
            max={100}
            value={page.heroOverlayOpacity ?? 100}
            onChange={(e) => onChange({ heroOverlayOpacity: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-dt-border p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Top nav layer</p>
        <Field label="Page label">
          <TextInput value={page.navLabel || ""} onChange={(navLabel) => onChange({ navLabel })} />
        </Field>
        <Field label="Badge / pill label" hint='e.g. "Inner Circle"'>
          <TextInput value={page.navBadgeLabel || ""} onChange={(navBadgeLabel) => onChange({ navBadgeLabel })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nav text color">
            <ColorInput value={page.navTextColor || "#FFFFFF"} onChange={(navTextColor) => onChange({ navTextColor })} />
          </Field>
          <Field label="Badge color">
            <ColorInput value={page.navBadgeColor || "#8FE3B8"} onChange={(navBadgeColor) => onChange({ navBadgeColor })} />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Toggle
            checked={page.showNavBadge !== false}
            onChange={(showNavBadge) => onChange({ showNavBadge })}
            label="Badge"
          />
          <Toggle checked={page.showNavBell !== false} onChange={(showNavBell) => onChange({ showNavBell })} label="Bell" />
          <Toggle
            checked={page.showNavAvatar !== false}
            onChange={(showNavAvatar) => onChange({ showNavAvatar })}
            label="Avatar"
          />
        </div>
        <Field label="Avatar image URL">
          <TextInput value={page.navAvatarSrc || ""} onChange={(navAvatarSrc) => onChange({ navAvatarSrc })} />
        </Field>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-[10px] text-white/60"
          onChange={(e) => readImageFile(e.target.files?.[0] ?? null, (navAvatarSrc) => onChange({ navAvatarSrc }))}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-dt-border p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Signature layer</p>
        <Field label="Signature text" hint="Leave blank if you upload a signature graphic">
          <TextInput value={page.signatureText || ""} onChange={(signatureText) => onChange({ signatureText })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Signature color">
            <ColorInput
              value={page.signatureColor || "#FFFFFF"}
              onChange={(signatureColor) => onChange({ signatureColor })}
            />
          </Field>
          <Field label="Signature font">
            <FontSelect value={page.signatureFont} onChange={(signatureFont) => onChange({ signatureFont })} />
          </Field>
        </div>
        <Field label="Signature image URL">
          <TextInput value={page.signatureImage || ""} onChange={(signatureImage) => onChange({ signatureImage })} />
        </Field>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-[10px] text-white/60"
          onChange={(e) => readImageFile(e.target.files?.[0] ?? null, (signatureImage) => onChange({ signatureImage }))}
        />
      </div>

      <CardGridEditor page={page} onChange={onChange} />

      <div className="space-y-3 rounded-xl border border-dt-border p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
          Hero / player image
        </p>
        <p className="text-[11px] text-white/40">
          Empty by default — upload your athlete art (transparent PNGs work best).
        </p>
        {page.heroImage ? (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40 p-2">
            <img
              src={resolveExperiencePreviewUrl(page.heroImage)}
              alt=""
              className="mx-auto max-h-40 w-full"
              style={{
                objectFit: page.heroFit || "contain",
                objectPosition: `${page.heroOffsetX ?? 50}% ${page.heroOffsetY ?? 50}%`,
                transform: `scale(${(page.heroScale || 100) / 100})${
                  page.heroRotate ? ` rotate(${page.heroRotate}deg)` : ""
                }`,
                transformOrigin: "center center",
              }}
            />
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded border border-dashed border-white/15 text-[11px] text-white/35">
            Placement preview only — no starter photo
          </div>
        )}
        <TextInput value={page.heroImage} onChange={(heroImage) => onChange({ heroImage })} />
        <input
          type="file"
          accept="image/*"
          className="block w-full text-[10px] text-white/60"
          onChange={(e) => onUpload("heroImage", e.target.files?.[0] ?? null)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Zoom (${page.heroScale || 100}%)`}>
            <input
              type="range"
              min={40}
              max={180}
              value={page.heroScale || 100}
              onChange={(e) => onChange({ heroScale: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label="Fit">
            <select
              value={page.heroFit || "contain"}
              onChange={(e) => onChange({ heroFit: e.target.value as "contain" | "cover" })}
              className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm"
            >
              <option value="contain">Contain (no crop)</option>
              <option value="cover">Cover (fill)</option>
            </select>
          </Field>
          <Field label={`Crop left ↔ right (${page.heroOffsetX ?? 50}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={page.heroOffsetX ?? 50}
              onChange={(e) => onChange({ heroOffsetX: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label={`Crop top ↕ bottom (${page.heroOffsetY ?? 50}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={page.heroOffsetY ?? 50}
              onChange={(e) => onChange({ heroOffsetY: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label={`Rotate (${page.heroRotate ?? 0}°)`}>
            <input
              type="range"
              min={-180}
              max={180}
              value={page.heroRotate ?? 0}
              onChange={(e) => onChange({ heroRotate: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label="Quick presets">
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Reset", patch: { heroOffsetX: 50, heroOffsetY: 50, heroRotate: 0, heroScale: 100 } },
                { label: "Top", patch: { heroOffsetY: 0 } },
                { label: "Bottom", patch: { heroOffsetY: 100 } },
                { label: "Left", patch: { heroOffsetX: 0 } },
                { label: "Right", patch: { heroOffsetX: 100 } },
                { label: "-90°", patch: { heroRotate: -90 } },
                { label: "+90°", patch: { heroRotate: 90 } },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange(preset.patch)}
                  className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-dt-border p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Title art image</p>
        {page.titleImage ? (
          <img src={resolveExperiencePreviewUrl(page.titleImage)} alt="" className="h-24 w-full rounded object-contain" />
        ) : (
          <div className="flex h-20 items-center justify-center rounded border border-dashed border-white/15 text-[11px] text-white/35">
            Optional — upload or leave blank for text headline
          </div>
        )}
        <TextInput value={page.titleImage} onChange={(titleImage) => onChange({ titleImage })} />
        <input
          type="file"
          accept="image/*"
          className="block w-full text-[10px] text-white/60"
          onChange={(e) => onUpload("titleImage", e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
