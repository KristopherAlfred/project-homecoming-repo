import { useCallback, useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { BRAND_COLORS, brandIconMap } from "./BrandIcons";
import {
  fetchPlatformConnections,
  formatSyncedAgo,
  setPlatformConnected,
  type PlatformConnection,
} from "../../lib/platformConnections";
import { connectInstagram, syncInstagram } from "../../lib/instagramGraphApi";
import { connectYouTube, isYouTubeConnected, syncYouTube } from "../../lib/youtubeConnect";
import { invalidateSocialSources } from "../../lib/socialSources";

/** Platforms wired to a real OAuth connector (login popup + live sync). */
const OAUTH_PLATFORMS = new Set(["instagram", "youtube"]);

/** Google Cloud setup helper — shows the exact redirect URI to whitelist. */
function YouTubeSetupNote() {
  const [copied, setCopied] = useState(false);
  const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-auth/callback`;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-dt-border bg-black/25 p-4">
      <p className="text-xs font-semibold text-white">YouTube setup (Google Cloud)</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-white/50">
        <li>
          Open{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="text-dt-red underline"
          >
            Google Cloud → APIs &amp; Services → Credentials
          </a>{" "}
          and create an OAuth client ID of type “Web application”.
        </li>
        <li>
          In{" "}
          <a
            href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="text-dt-red underline"
          >
            API Library
          </a>
          , enable <span className="text-white/70">YouTube Data API v3</span> and{" "}
          <span className="text-white/70">YouTube Analytics API</span>.
        </li>
        <li>
          On the OAuth consent screen add the scopes <code>youtube.readonly</code>,{" "}
          <code>yt-analytics.readonly</code> and <code>youtube.upload</code>, then add your Google
          account as a test user (or publish the app).
        </li>
        <li>Paste this exact “Authorized redirect URI” into the OAuth client:</li>
      </ol>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-dt-border bg-black/50 px-3 py-2 text-[11px] text-white/70">
          {callbackUrl}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(callbackUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg border border-dt-border px-3 py-2 text-[11px] font-semibold text-white/70 transition hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-white/40">
        Then hit Connect on the YouTube card — sign in with the Google account that owns the channel.
      </p>
    </div>
  );
}



/** Platforms whose live analytics need the athlete's own handle / page / channel. */
const HANDLE_HINTS: Record<string, string> = {
  instagram: "your-instagram-username",
  x: "your-x-handle",
  facebook: "your-facebook-page",
  tiktok: "your-tiktok-username",
  youtube: "@your-channel or UC… channel id",
};



export function ConnectorCards() {
  const [rows, setRows] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handleDraft, setHandleDraft] = useState<{ id: string; value: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await fetchPlatformConnections());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load connectors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(row: PlatformConnection, connected: boolean, handle?: string | null) {
    setBusyId(row.id);
    try {
      if (row.platform === "instagram" && connected) {
        await connectInstagram();
        await syncInstagram();
        if (handle) await setPlatformConnected(row.id, true, handle);
      } else if (row.platform === "youtube" && connected) {
        await connectYouTube();
        await syncYouTube();
      } else {
        await setPlatformConnected(row.id, connected, handle ?? null);
      }
      invalidateSocialSources();
      setHandleDraft(null);
      await load();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }


  async function resync(row: PlatformConnection) {
    setBusyId(row.id);
    try {
      if (row.platform === "youtube") {
        if (!(await isYouTubeConnected())) {
          throw new Error("Connect your YouTube channel with Google first, then sync.");
        }
        await syncYouTube();
      } else await syncInstagram();

      invalidateSocialSources();
      await load();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusyId(null);
    }
  }



  return (
    <section data-tour="connector-cards" className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
      <div className="border-b border-dt-border px-5 py-4">
        <div className="flex items-center gap-2 text-dt-red">
          <Link2 size={16} />
          <h3 className="font-display text-sm font-semibold tracking-wide text-white">
            Connected platforms
          </h3>
        </div>
        <p className="mt-1 text-[11px] text-white/40">
          Social sources powering Content and overview analytics
        </p>
      </div>

      {error ? (
        <p className="px-5 py-4 text-sm text-white/60">{error}</p>
      ) : null}

      <YouTubeSetupNote />


      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[168px] animate-pulse rounded-2xl border border-dt-border bg-black/25"
              />
            ))
          : rows.map((row) => {
              const Icon = brandIconMap[row.platform];
              const brand = BRAND_COLORS[row.platform] ?? "var(--theme-accent)";
              const busy = busyId === row.id;
              return (
                <div
                  key={row.id}
                  className="dt-surface flex flex-col rounded-2xl border border-dt-border bg-black/25 p-4 transition hover:border-white/15"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/50"
                      style={{ color: brand, boxShadow: `inset 0 0 18px color-mix(in srgb, ${brand} 18%, transparent)` }}
                    >
                      {Icon ? <Icon size={20} /> : <Link2 size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-white">
                        {row.display_name}
                      </p>
                      <p className="truncate text-[12px] text-white/45">
                        {row.connected ? row.handle ?? "—" : "Not connected"}
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        row.connected
                          ? "bg-dt-red shadow-[0_0_10px_var(--theme-accent)]"
                          : "border border-white/25 bg-transparent"
                      }`}
                      aria-label={row.connected ? "Connected" : "Not connected"}
                    />
                  </div>

                  <p className="mt-3 text-[11px] text-white/40">
                    {row.connected ? formatSyncedAgo(row.last_synced_at) : "Not connected"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    {row.connected ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={
                            OAUTH_PLATFORMS.has(row.platform) ? () => resync(row) : undefined
                          }
                          className="flex-1 rounded-xl border border-dt-border bg-black/40 px-3 py-2 text-xs font-semibold text-white transition hover:border-dt-red/50 hover:text-dt-red disabled:opacity-50"
                        >
                          {OAUTH_PLATFORMS.has(row.platform)
                            ? busy
                              ? "Syncing…"
                              : "Sync now"
                            : "Configure"}
                        </button>


                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggle(row, false)}
                          className="flex-1 rounded-xl border border-dt-border bg-transparent px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                        >
                          {busy ? "…" : "Disconnect"}
                        </button>
                      </>
                    ) : HANDLE_HINTS[row.platform] && row.platform !== "youtube" ? (
                      handleDraft?.id === row.id ? (
                        <form
                          className="flex w-full flex-col gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const value = handleDraft.value.trim();
                            if (!value) return;
                            void toggle(row, true, value);
                          }}
                        >
                          <input
                            autoFocus
                            value={handleDraft.value}
                            onChange={(event) =>
                              setHandleDraft({ id: row.id, value: event.target.value })
                            }
                            placeholder={HANDLE_HINTS[row.platform]}
                            className="w-full rounded-xl border border-dt-border bg-black/50 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-dt-red/60"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={busy || !handleDraft.value.trim()}
                              className="flex-1 rounded-xl bg-dt-red px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                            >
                              {busy ? "Connecting…" : "Connect"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setHandleDraft(null)}
                              className="rounded-xl border border-dt-border px-3 py-2 text-xs font-semibold text-white/60 transition hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setHandleDraft({ id: row.id, value: "" })}
                          className="w-full rounded-xl bg-dt-red px-3 py-2.5 text-xs font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                        >
                          Connect
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggle(row, true)}
                        className="w-full rounded-xl bg-dt-red px-3 py-2.5 text-xs font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                      >
                        {busy ? "Connecting…" : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
