import { Link } from "@/lib/router-compat";
import { Check } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import {
  CONNECTION_LABELS,
  PLATFORMS,
  PLATFORM_ORDER,
  supportsContentType,
  type ContentType,
  type StudioPlatformKey,
} from "../../lib/contentStudio/platforms";
import { accountInitials, formatCount, useStudioAccounts } from "../../lib/contentStudio/accounts";
import { CONNECT_PLATFORMS_ROUTE } from "../../lib/socialSources";

export function PlatformAvatar({
  url,
  name,
  size = 28,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-semibold text-white/70"
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
    >
      {accountInitials(name) || "P"}
    </span>
  );
}

/** Reusable connected-account row used by the composer and the schedule step. */
export function PlatformAccountRow({
  platform,
  selected,
  onToggle,
  contentType,
  compact = false,
}: {
  platform: StudioPlatformKey;
  selected: boolean;
  onToggle: () => void;
  contentType: ContentType;
  compact?: boolean;
}) {
  const { accounts } = useStudioAccounts();
  const account = accounts[platform];
  const def = PLATFORMS[platform];
  const typeOk = supportsContentType(platform, contentType);
  // Every destination stays selectable so its preview can be inspected, even when
  // the account isn't connected yet or the content type isn't publishable there.
  const disabled = false;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 transition ${compact ? "py-2" : "py-2.5"} ${
        selected
          ? "border-dt-red/50 bg-dt-red/[0.08]"
          : "border-dt-border bg-black/30 hover:border-white/20"
      }`}
    >
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        aria-label={`Select ${def.label}`}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
          selected ? "border-dt-red bg-dt-red text-white" : "border-white/25 bg-transparent text-transparent"
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      <PlatformIcon platform={platform} size={18} />
      <PlatformAvatar url={account.avatarUrl} name={account.displayName} size={26} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white">{def.label}</p>
        <p className="truncate text-[11px] text-dt-muted">
          {account.connected
            ? [account.handle ? `@${account.handle}` : account.displayName,
               account.followers !== null ? `${formatCount(account.followers)} followers` : null]
                .filter(Boolean)
                .join(" · ")
            : `${CONNECTION_LABELS[account.connection]} · preview only`}
        </p>
      </div>

      {account.connected && typeOk ? (
        <span className="shrink-0 rounded-lg border border-dt-green/30 bg-dt-green/10 px-2 py-1 text-[10px] font-semibold text-dt-green">
          Ready
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-white/60"
            title={typeOk ? "Preview only until connected" : `Preview only — ${def.label} can't publish this content type`}
          >
            Preview
          </span>
          {!account.connected && (
            <Link
              to={CONNECT_PLATFORMS_ROUTE}
              className="rounded-lg border border-dt-red/50 px-2.5 py-1 text-[11px] font-semibold text-dt-red transition hover:bg-dt-red/10"
            >
              Connect
            </Link>
          )}
        </div>
      )}


    </div>
  );
}

export function PlatformSelector({
  selected,
  onChange,
  contentType,
}: {
  selected: StudioPlatformKey[];
  onChange: (next: StudioPlatformKey[]) => void;
  contentType: ContentType;
}) {
  const { loading } = useStudioAccounts();

  const selectable = PLATFORM_ORDER;
  const allSelected = selectable.length > 0 && selectable.every((k) => selected.includes(k));

  function toggle(key: StudioPlatformKey) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Select platforms</h3>
          <p className="text-[11px] text-dt-muted">
            {loading ? "Loading your connected accounts…" : `${selected.length} destination${selected.length === 1 ? "" : "s"} selected`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : selectable)}
          className="rounded-lg border border-dt-border px-2.5 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="space-y-2">
        {PLATFORM_ORDER.map((key) => (
          <PlatformAccountRow
            key={key}
            platform={key}
            selected={selected.includes(key)}
            onToggle={() => toggle(key)}
            contentType={contentType}
          />
        ))}
      </div>
    </div>
  );
}
