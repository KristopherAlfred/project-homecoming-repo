import type { TitleFontFamily, TitleFontSize } from "../lib/typography";
import { TITLE_FONT_OPTIONS, TITLE_SIZE_OPTIONS } from "../lib/typography";
import { DtSelect } from "./DtSelect";

type TypographyControlsProps = {
  fontFamily?: TitleFontFamily | string;
  fontSize?: TitleFontSize | string;
  onFontFamilyChange: (value: TitleFontFamily) => void;
  onFontSizeChange: (value: TitleFontSize) => void;
  label?: string;
  className?: string;
};

export function TypographyControls({
  fontFamily = "default",
  fontSize = "md",
  onFontFamilyChange,
  onFontSizeChange,
  label = "Title typography",
  className = "",
}: TypographyControlsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">Font</span>
          <DtSelect
            value={fontFamily || "default"}
            aria-label="Font"
            onChange={(value) => onFontFamilyChange(value as TitleFontFamily)}
            options={TITLE_FONT_OPTIONS.map((option) => ({
              value: option.id,
              label: option.label,
              style: { fontFamily: option.css },
            }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">Size</span>
          <DtSelect
            value={fontSize || "md"}
            aria-label="Size"
            onChange={(value) => onFontSizeChange(value as TitleFontSize)}
            options={TITLE_SIZE_OPTIONS.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
          />
        </label>
      </div>
    </div>
  );
}
