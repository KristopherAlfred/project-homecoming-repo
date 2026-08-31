import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { PageShell, StatCard } from "../../components/PageShell";
import { PlatformIcon } from "../../components/contentStudio/PlatformIcon";
import { MediaThumb } from "../../components/contentStudio/MediaUploader";
import { useContentStudio } from "../../lib/contentStudio/store";
import { formatCount, useStudioAccounts } from "../../lib/contentStudio/accounts";
import { PLATFORMS, PLATFORM_ORDER } from "../../lib/contentStudio/platforms";
import { CONNECT_PLATFORMS_ROUTE } from "../../lib/socialSources";

/**
 * Publishing analytics for this workspace only. Reach / engagement stay blank
 * until the platform APIs report real numbers for the connected account —
 * nothing is estimated or borrowed from another workspace.
 */
export function ContentAnalyticsPage() {
  const { content, mediaById } = useContentStudio();
  const { accounts, connectedKeys } = useStudioAccounts();

  const published = useMemo(() => content.filter((c) => c.status === "published"), [content]);

  const perPlatform = useMemo(
    () =>
      PLATFORM_ORDER.map((platform) => ({
        platform,
        posts: published.filter((c) => c.platforms.includes(platform)).length,
        followers: accounts[platform].followers,
        connected: accounts[platform].connected,
      })),
    [published, accounts],
  );

  return (
    <PageShell>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published posts" value={String(published.length)} hint="All destinations" />
        <StatCard
          label="Total destinations used"
          value={String(new Set(published.flatMap((c) => c.platforms)).size)}
        />
        <StatCard label="Connected accounts" value={String(connectedKeys.length)} />
        <StatCard
          label="Audience reached"
          value={formatCount(
            connectedKeys.reduce((sum, key) => sum + (accounts[key].followers ?? 0), 0) || null,
          )}
          hint="Sum of connected follower counts"
        />
      </div>

      <div className="dt-surface overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="dt-surface-header border-b border-dt-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-white">
            Performance by platform
          </h2>
        </div>
        <div className="divide-y divide-dt-border">
          {perPlatform.map((row) => (
            <div key={row.platform} className="flex items-center gap-3 px-4 py-3">
              <PlatformIcon platform={row.platform} size={17} />
              <span className="flex-1 text-[12px] font-semibold text-white">
                {PLATFORMS[row.platform].label}
              </span>
              <span className="w-20 text-right text-[12px] text-white/75">{row.posts} posts</span>
              <span className="w-24 text-right text-[12px] text-white/75">
                {formatCount(row.followers)}
              </span>
              {row.connected ? (
                <span className="w-24 text-right text-[11px] text-dt-muted">Awaiting API stats</span>
              ) : (
                <Link
                  to={CONNECT_PLATFORMS_ROUTE}
                  className="w-24 text-right text-[11px] font-semibold text-dt-red"
                >
                  Connect
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dt-surface overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="dt-surface-header border-b border-dt-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-white">
            Recently published
          </h2>
        </div>
        {published.length === 0 ? (
          <p className="px-4 py-12 text-center text-[12px] text-dt-muted">
            Nothing published from this workspace yet.
          </p>
        ) : (
          <div className="divide-y divide-dt-border">
            {published.slice(0, 8).map((record) => {
              const asset = mediaById.get(record.mediaIds[0] ?? "");
              return (
                <div key={record.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-lg border border-dt-border bg-black/40">
                    {asset && <MediaThumb asset={asset} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white">
                      {record.title || record.caption || "Untitled"}
                    </p>
                    <p className="text-[11px] text-dt-muted">
                      {new Date(record.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {record.platforms.map((platform) => (
                      <PlatformIcon key={platform} platform={platform} size={13} />
                    ))}
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
