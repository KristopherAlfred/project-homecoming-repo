import { useMemo } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { PlatformAvatar } from "./PlatformSelector";
import { MediaThumb } from "./MediaUploader";
import { formatCount, useStudioAccounts } from "../../lib/contentStudio/accounts";
import { resolveVariant, useContentStudio, type ContentRecord } from "../../lib/contentStudio/store";
import type { StudioPlatformKey } from "../../lib/contentStudio/platforms";

export function usePreviewModel(record: ContentRecord, platform: StudioPlatformKey) {
  const { mediaById } = useContentStudio();
  const { accounts } = useStudioAccounts();
  const variant = resolveVariant(record, platform);
  const assets = useMemo(
    () => variant.mediaIds.map((id) => mediaById.get(id)).filter(Boolean),
    [variant.mediaIds, mediaById],
  );
  return { variant, assets, account: accounts[platform] };
}

function MediaFrame({
  record,
  platform,
  aspect = "aspect-square",
  rounded = "",
}: {
  record: ContentRecord;
  platform: StudioPlatformKey;
  aspect?: string;
  rounded?: string;
}) {
  const { assets } = usePreviewModel(record, platform);
  const asset = assets[0];
  return (
    <div className={`relative w-full overflow-hidden bg-white/[0.04] ${aspect} ${rounded}`}>
      {asset ? (
        <MediaThumb asset={asset} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-white/35">
          Add media to preview
        </div>
      )}
      {assets.length > 1 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
          1/{assets.length}
        </span>
      )}
    </div>
  );
}

function CaptionText({ text, hashtags }: { text: string; hashtags?: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-white/85">
      {text || <span className="text-white/35">Your caption will appear here…</span>}
      {hashtags ? <span className="text-sky-400"> {hashtags}</span> : null}
    </p>
  );
}

function PreviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dt-border bg-black/50">{children}</div>
  );
}

function AccountLine({
  record,
  platform,
  sub,
}: {
  record: ContentRecord;
  platform: StudioPlatformKey;
  sub?: string;
}) {
  const { account } = usePreviewModel(record, platform);
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <PlatformAvatar url={account.avatarUrl} name={account.displayName} size={30} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-white">
          {account.handle ?? account.displayName}
        </p>
        {sub && <p className="truncate text-[10px] text-white/45">{sub}</p>}
      </div>
      <MoreHorizontal size={16} className="text-white/40" />
    </div>
  );
}

function InstagramPost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "instagram");
  return (
    <PreviewCard>
      <AccountLine record={record} platform="instagram" sub="Sponsored by nobody · just you" />
      <MediaFrame record={record} platform="instagram" />
      <div className="space-y-2 px-3 py-3">
        <div className="flex items-center gap-4 text-white/85">
          <Heart size={17} />
          <MessageCircle size={17} />
          <Send size={17} />
          <Bookmark size={17} className="ml-auto" />
        </div>
        <p className="text-[11px] font-semibold text-white">
          {formatCount(account.followers ? Math.round(account.followers * 0.04) : null)} likes
        </p>
        <CaptionText text={variant.caption} hashtags={variant.hashtags} />
        <p className="text-[10px] text-white/35">Just now</p>
      </div>
    </PreviewCard>
  );
}

function TikTokPost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "tiktok");
  return (
    <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-dt-border bg-black">
      <div className="relative aspect-[9/16]">
        <MediaFrame record={record} platform="tiktok" aspect="h-full" />
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/90 to-transparent px-3 pb-4 pt-10">
          <p className="text-[12px] font-semibold text-white">@{account.handle ?? account.displayName}</p>
          <CaptionText text={variant.caption} hashtags={variant.hashtags} />
          <p className="flex items-center gap-1.5 text-[10px] text-white/70">
            <Music2 size={11} /> original sound – {account.handle ?? account.displayName}
          </p>
        </div>
        <div className="absolute bottom-16 right-2 flex flex-col items-center gap-4 text-white">
          <Heart size={20} />
          <MessageCircle size={20} />
          <Bookmark size={20} />
          <Share2 size={20} />
        </div>
      </div>
    </div>
  );
}

function XPost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "x");
  return (
    <PreviewCard>
      <div className="flex gap-3 p-3">
        <PlatformAvatar url={account.avatarUrl} name={account.displayName} size={34} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[12px] text-white">
            <span className="font-semibold">{account.displayName}</span>{" "}
            <span className="text-white/45">@{account.handle ?? "handle"} · now</span>
          </p>
          <CaptionText text={variant.caption} hashtags={variant.hashtags} />
          <div className="overflow-hidden rounded-xl border border-white/10">
            <MediaFrame record={record} platform="x" aspect="aspect-video" />
          </div>
          <div className="flex items-center gap-5 pt-1 text-white/45">
            <span className="flex items-center gap-1 text-[11px]"><MessageCircle size={13} /> 0</span>
            <span className="flex items-center gap-1 text-[11px]"><Repeat2 size={13} /> 0</span>
            <span className="flex items-center gap-1 text-[11px]"><Heart size={13} /> 0</span>
            <span className="flex items-center gap-1 text-[11px]"><Bookmark size={13} /> 0</span>
            <span className="text-[11px]">0 views</span>
          </div>
        </div>
      </div>
    </PreviewCard>
  );
}

function FacebookPost({ record }: { record: ContentRecord }) {
  const { variant } = usePreviewModel(record, "facebook");
  return (
    <PreviewCard>
      <AccountLine record={record} platform="facebook" sub="Just now · Public" />
      <div className="px-3 pb-2">
        <CaptionText text={variant.caption} hashtags={variant.hashtags} />
      </div>
      <MediaFrame record={record} platform="facebook" aspect="aspect-video" />
      <div className="flex items-center justify-around border-t border-white/10 py-2 text-[11px] text-white/60">
        <span className="flex items-center gap-1.5"><ThumbsUp size={13} /> Like</span>
        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> Comment</span>
        <span className="flex items-center gap-1.5"><Share2 size={13} /> Share</span>
      </div>
    </PreviewCard>
  );
}

function YouTubePost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "youtube");
  const short = record.contentType === "reel";
  return (
    <PreviewCard>
      <MediaFrame record={record} platform="youtube" aspect={short ? "aspect-[9/16]" : "aspect-video"} />
      <div className="flex gap-2.5 p-3">
        <PlatformAvatar url={account.avatarUrl} name={account.displayName} size={30} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[12px] font-semibold text-white">
            {variant.title || <span className="text-white/35">Add a title for YouTube…</span>}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-white/45">
            {account.displayName} · 0 views · just now
          </p>
          <div className="mt-2">
            <CaptionText text={variant.description} hashtags={variant.hashtags} />
          </div>
        </div>
      </div>
    </PreviewCard>
  );
}

function TwitchPost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "twitch");
  return (
    <PreviewCard>
      <div className="relative">
        <MediaFrame record={record} platform="twitch" aspect="aspect-video" />
        <span className="absolute left-2 top-2 rounded bg-dt-red px-1.5 py-0.5 text-[9px] font-bold text-white">
          LIVE
        </span>
      </div>
      <div className="flex gap-2.5 p-3">
        <PlatformAvatar url={account.avatarUrl} name={account.displayName} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-white">
            {variant.title || <span className="text-white/35">Stream title…</span>}
          </p>
          <p className="truncate text-[10px] text-white/45">{account.displayName}</p>
          <div className="mt-1.5">
            <CaptionText text={variant.caption} />
          </div>
        </div>
        <button type="button" className="h-fit rounded-md bg-[#9146FF] px-2.5 py-1 text-[10px] font-bold text-white">
          Follow
        </button>
      </div>
    </PreviewCard>
  );
}

function SpotifyPost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "spotify");
  return (
    <PreviewCard>
      <div className="flex gap-3 p-3">
        <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-lg">
          <MediaFrame record={record} platform="spotify" aspect="h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            {record.contentType === "audio" ? "Episode" : "Release"}
          </p>
          <p className="truncate text-[13px] font-semibold text-white">
            {variant.title || <span className="text-white/35">Episode title…</span>}
          </p>
          <p className="truncate text-[11px] text-white/50">{account.displayName}</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#1DB954] px-3 py-1 text-[11px] font-bold text-black"
          >
            <Play size={11} /> Play
          </button>
        </div>
      </div>
      <div className="border-t border-white/10 px-3 py-2.5">
        <CaptionText text={variant.description} />
      </div>
    </PreviewCard>
  );
}

function FanAppPost({ record }: { record: ContentRecord }) {
  const { variant, account } = usePreviewModel(record, "fanapp");
  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[26px] border border-white/12 bg-black p-2">
      <div className="overflow-hidden rounded-[20px] border border-white/10 bg-dt-card">
        <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
          <PlatformIcon platform="fanapp" size={18} />
          <p className="flex-1 truncate font-display text-[12px] font-bold tracking-wide text-white">
            {account.displayName}
          </p>
        </div>
        <div className="flex gap-3 border-b border-white/8 px-3 py-2 text-[10px] font-semibold">
          <span style={{ color: "var(--theme-accent)" }}>Feed</span>
          <span className="text-white/40">Events</span>
          <span className="text-white/40">Exclusive</span>
        </div>
        <MediaFrame record={record} platform="fanapp" aspect="aspect-[4/5]" />
        <div className="space-y-2 px-3 py-3">
          <CaptionText text={variant.caption} hashtags={variant.hashtags} />
          <div className="flex items-center gap-4 text-white/70">
            <Heart size={15} style={{ color: "var(--theme-accent)" }} />
            <MessageCircle size={15} />
            <Share2 size={15} />
            <span className="ml-auto text-[10px] text-white/35">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Post-level preview for any destination. */
export function PostPreview({
  record,
  platform,
}: {
  record: ContentRecord;
  platform: StudioPlatformKey;
}) {
  switch (platform) {
    case "instagram":
      return <InstagramPost record={record} />;
    case "tiktok":
      return <TikTokPost record={record} />;
    case "x":
      return <XPost record={record} />;
    case "facebook":
      return <FacebookPost record={record} />;
    case "youtube":
      return <YouTubePost record={record} />;
    case "twitch":
      return <TwitchPost record={record} />;
    case "spotify":
      return <SpotifyPost record={record} />;
    case "fanapp":
    default:
      return <FanAppPost record={record} />;
  }
}
