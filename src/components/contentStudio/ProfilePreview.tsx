import { Play } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { PlatformAvatar } from "./PlatformSelector";
import { MediaThumb } from "./MediaUploader";
import { type StudioPlatformKey } from "../../lib/contentStudio/platforms";
import { formatCount, useStudioAccounts } from "../../lib/contentStudio/accounts";
import { resolveVariant, useContentStudio, type ContentRecord } from "../../lib/contentStudio/store";

/**
 * Grid/feed preview showing where a draft lands inside the account's profile.
 * Existing tiles come from this workspace's own studio history — never samples.
 */
export function ProfilePreview({
  record,
  platform,
}: {
  record: ContentRecord;
  platform: StudioPlatformKey;
}) {
  const { accounts } = useStudioAccounts();
  const { content, mediaById } = useContentStudio();
  const account = accounts[platform];

  const draftAsset = mediaById.get(resolveVariant(record, platform).mediaIds[0] ?? "");
  const history = content
    .filter((r: ContentRecord) => r.id !== record.id && r.platforms.includes(platform))
    .sort((a: ContentRecord, b: ContentRecord) => (b.scheduledAt ?? b.createdAt).localeCompare(a.scheduledAt ?? a.createdAt))
    .map((r: ContentRecord) => mediaById.get(resolveVariant(r, platform).mediaIds[0] ?? ""))
    .filter(Boolean)
    .slice(0, 11);

  const listStyle = platform === "youtube" || platform === "spotify" || platform === "twitch";

  return (
    <div className="overflow-hidden rounded-2xl border border-dt-border bg-black/50">
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
        <PlatformAvatar url={account.avatarUrl} name={account.displayName} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <PlatformIcon platform={platform} size={14} />
            <p className="truncate text-[13px] font-semibold text-white">
              {account.handle ? `@${account.handle}` : account.displayName}
            </p>
          </div>
          <p className="truncate text-[11px] text-dt-muted">{account.displayName}</p>
          <div className="mt-1 flex gap-4 text-[10px] text-white/55">
            <span>
              <strong className="text-white">{formatCount(account.followers)}</strong>{" "}
              {platform === "youtube" ? "subscribers" : "followers"}
            </span>
            <span>
              <strong className="text-white">{history.length + 1}</strong> posts
            </span>
          </div>
        </div>
      </div>

      {listStyle ? (
        <div className="divide-y divide-white/6">
          {[{ asset: draftAsset, isDraft: true }, ...history.map((asset: typeof history[number]) => ({ asset, isDraft: false }))]
            .slice(0, 5)
            .map((row, index) => (
              <div key={index} className="flex gap-3 p-3">
                <div className="relative h-[54px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                  {row.asset ? (
                    <MediaThumb asset={row.asset} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/25">
                      <Play size={14} />
                    </div>
                  )}
                  {row.isDraft && (
                    <span className="absolute inset-x-0 bottom-0 bg-dt-red/85 py-0.5 text-center text-[8px] font-bold text-white">
                      THIS POST
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[11px] font-semibold text-white/90">
                    {row.isDraft
                      ? resolveVariant(record, platform).title ||
                        resolveVariant(record, platform).caption ||
                        "Untitled draft"
                      : "Previous upload"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    {account.displayName} · {row.isDraft ? "scheduled" : "published"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px] p-[2px]">
          <div className="relative aspect-square overflow-hidden bg-white/[0.05]">
            {draftAsset ? (
              <MediaThumb asset={draftAsset} />
            ) : (
              <div className="flex h-full items-center justify-center text-[9px] text-white/30">
                New post
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-dt-red/85 py-0.5 text-center text-[8px] font-bold text-white">
              THIS POST
            </span>
          </div>
          {Array.from({ length: 11 }).map((_, index) => {
            const asset = history[index];
            return (
              <div key={index} className="aspect-square overflow-hidden bg-white/[0.035]">
                {asset ? (
                  <MediaThumb asset={asset} />
                ) : (
                  <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.02)_0_6px,transparent_6px_12px)]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
