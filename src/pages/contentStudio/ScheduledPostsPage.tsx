import { useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Copy, Pencil, RefreshCw, Send, Trash2 } from "lucide-react";
import { PageShell } from "../../components/PageShell";
import { PlatformIcon } from "../../components/contentStudio/PlatformIcon";
import { MediaThumb } from "../../components/contentStudio/MediaUploader";
import { useContentStudio, type ContentRecord } from "../../lib/contentStudio/store";
import { PLATFORMS } from "../../lib/contentStudio/platforms";

const FILTERS = ["all", "draft", "scheduled", "publishing", "published", "failed"] as const;

const TONE: Record<string, string> = {
  draft: "border-white/15 bg-white/[0.05] text-white/70",
  scheduled: "border-sky-500/35 bg-sky-500/10 text-sky-200",
  publishing: "border-amber-500/35 bg-amber-500/10 text-amber-200",
  published: "border-dt-green/35 bg-dt-green/10 text-dt-green",
  failed: "border-dt-red/40 bg-dt-red/10 text-dt-red",
};

export function ScheduledPostsPage() {
  const navigate = useNavigate();
  const { content, mediaById, deleteContent, duplicateContent, publishNow, retryPlatform } =
    useContentStudio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const rows = useMemo(
    () =>
      content
        .filter((c) => filter === "all" || c.status === filter)
        .sort((a: ContentRecord, b: ContentRecord) =>
          (b.scheduledAt ?? b.createdAt).localeCompare(a.scheduledAt ?? a.createdAt),
        ),
    [content, filter],
  );

  return (
    <PageShell>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
              filter === key
                ? "border-dt-red bg-dt-red/12 text-white"
                : "border-dt-border text-white/55 hover:text-white"
            }`}
          >
            {key} ({key === "all" ? content.length : content.filter((c) => c.status === key).length})
          </button>
        ))}
      </div>

      <div className="dt-surface overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        {rows.length === 0 ? (
          <p className="px-4 py-14 text-center text-[12px] text-dt-muted">
            Nothing here yet — create content to fill your queue.
          </p>
        ) : (
          <div className="divide-y divide-dt-border">
            {rows.map((record) => {
              const asset = mediaById.get(record.mediaIds[0] ?? "");
              return (
                <div key={record.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border border-dt-border bg-black/40">
                    {asset ? (
                      <MediaThumb asset={asset} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] text-white/30">
                        No media
                      </div>
                    )}
                  </div>

                  <div className="min-w-[180px] flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {record.title || record.caption || "Untitled content"}
                    </p>
                    <p className="truncate text-[11px] text-dt-muted">
                      {record.scheduledAt
                        ? new Date(record.scheduledAt).toLocaleString()
                        : "No date set"}{" "}
                      · {record.contentType}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {record.platforms.map((platform) => {
                      const state = record.publishStatus[platform]?.state ?? record.status;
                      return (
                        <span
                          key={platform}
                          title={`${PLATFORMS[platform].label}: ${state}`}
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-semibold ${TONE[state] ?? TONE.draft}`}
                        >
                          <PlatformIcon platform={platform} size={11} />
                          {state === "failed" && (
                            <button
                              type="button"
                              onClick={() => retryPlatform(record.id, platform)}
                              className="underline"
                            >
                              retry
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>

                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold capitalize ${TONE[record.status]}`}
                  >
                    {record.status}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => navigate(`/studio/create?id=${record.id}`)}
                      className="rounded-lg border border-dt-border p-1.5 text-white/60 hover:text-white"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Duplicate"
                      onClick={() => duplicateContent(record.id)}
                      className="rounded-lg border border-dt-border p-1.5 text-white/60 hover:text-white"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label={record.status === "failed" ? "Retry" : "Publish now"}
                      onClick={() => publishNow(record.id)}
                      className="rounded-lg border border-dt-border p-1.5 text-white/60 hover:text-white"
                    >
                      {record.status === "failed" ? <RefreshCw size={13} /> : <Send size={13} />}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => deleteContent(record.id)}
                      className="rounded-lg border border-dt-border p-1.5 text-white/50 hover:border-dt-red/40 hover:text-dt-red"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
