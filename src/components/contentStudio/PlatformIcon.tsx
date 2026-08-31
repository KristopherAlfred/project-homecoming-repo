import { brandIconMap } from "../settings/BrandIcons";
import { PLATFORMS, type StudioPlatformKey } from "../../lib/contentStudio/platforms";

/** Official-looking platform mark. The Fan App uses the PlayersOS accent badge. */
export function PlatformIcon({
  platform,
  size = 16,
  className = "",
  mono = false,
}: {
  platform: StudioPlatformKey;
  size?: number;
  className?: string;
  mono?: boolean;
}) {
  const def = PLATFORMS[platform];

  if (platform === "fanapp") {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold leading-none text-white ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(8, size * 0.52),
          background: mono ? "transparent" : "var(--theme-accent)",
          border: mono ? "1px solid var(--theme-accent)" : "none",
          color: mono ? "var(--theme-accent)" : "#fff",
        }}
        aria-hidden
      >
        P
      </span>
    );
  }

  const Icon = brandIconMap[def.connectorKey ?? platform] ?? brandIconMap.x;
  return (
    <Icon
      size={size}
      className={`shrink-0 ${className}`}
      style={{ color: mono ? "currentColor" : def.color }}
    />
  );
}

export function PlatformChip({
  platform,
  active = false,
  onClick,
  disabled = false,
}: {
  platform: StudioPlatformKey;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const def = PLATFORMS[platform];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
        active
          ? "border-dt-red/60 bg-dt-red/12 text-white"
          : "border-dt-border bg-black/40 text-white/60 hover:border-white/25 hover:text-white"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <PlatformIcon platform={platform} size={14} />
      {def.label}
    </button>
  );
}
