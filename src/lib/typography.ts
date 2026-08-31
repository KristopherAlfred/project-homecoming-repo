export type TitleFontFamily =
  | "default"
  | "times"
  | "georgia"
  | "arial"
  | "helvetica"
  | "verdana"
  | "courier"
  | "impact"
  | "barlow"
  | "source_sans";

export type TitleFontSize = "sm" | "md" | "lg" | "xl" | "2xl";

export type TypographySettings = {
  titleFontFamily?: TitleFontFamily;
  titleFontSize?: TitleFontSize;
};

export const TITLE_FONT_OPTIONS: { id: TitleFontFamily; label: string; css: string }[] = [
  { id: "default", label: "Default display", css: "var(--font-display), ui-sans-serif, system-ui, sans-serif" },
  { id: "barlow", label: "Barlow Condensed", css: '"Barlow Condensed", ui-sans-serif, system-ui, sans-serif' },
  { id: "source_sans", label: "Source Sans 3", css: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif' },
  { id: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { id: "georgia", label: "Georgia", css: "Georgia, serif" },
  { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "courier", label: "Courier New", css: '"Courier New", Courier, monospace' },
  { id: "impact", label: "Impact", css: "Impact, Haettenschweiler, sans-serif" },
];

export const TITLE_SIZE_OPTIONS: { id: TitleFontSize; label: string; css: string }[] = [
  { id: "sm", label: "Small", css: "0.85rem" },
  { id: "md", label: "Medium", css: "1rem" },
  { id: "lg", label: "Large", css: "1.15rem" },
  { id: "xl", label: "Extra large", css: "1.35rem" },
  { id: "2xl", label: "Huge", css: "1.6rem" },
];

export function resolveTitleFontFamily(value?: string | null) {
  const match = TITLE_FONT_OPTIONS.find((option) => option.id === value);
  return match?.css ?? TITLE_FONT_OPTIONS[0].css;
}

export function resolveTitleFontSize(value?: string | null) {
  const match = TITLE_SIZE_OPTIONS.find((option) => option.id === value);
  return match?.css ?? "";
}

export function normalizeTitleFontFamily(value: unknown): TitleFontFamily | undefined {
  const raw = String(value || "").trim();
  return TITLE_FONT_OPTIONS.some((option) => option.id === raw) ? (raw as TitleFontFamily) : undefined;
}

export function normalizeTitleFontSize(value: unknown): TitleFontSize | undefined {
  const raw = String(value || "").trim();
  return TITLE_SIZE_OPTIONS.some((option) => option.id === raw) ? (raw as TitleFontSize) : undefined;
}

export function titleTypographyStyle(settings?: TypographySettings | null): {
  fontFamily?: string;
  fontSize?: string;
} {
  const style: { fontFamily?: string; fontSize?: string } = {};
  if (settings?.titleFontFamily && settings.titleFontFamily !== "default") {
    style.fontFamily = resolveTitleFontFamily(settings.titleFontFamily);
  }
  if (settings?.titleFontSize) {
    style.fontSize = resolveTitleFontSize(settings.titleFontSize);
  }
  return style;
}
