import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Globe, Loader2, RefreshCw } from "lucide-react";

import type { ExperienceConfig } from "../../lib/experienceConfig";
import { fanAppUrl, fetchFanApp, publishFanApp, type FanAppRecord } from "../../lib/fanAppPublish";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Turns the designed experience into a real, shareable link at /app/:slug —
 * publish, copy, open, and re-publish updates without leaving the studio.
 */
export function FanAppPublishCard({
  athleteId,
  appName,
  experience,
}: {
  athleteId: string | null;
  appName: string;
  experience: ExperienceConfig;
}) {
  const [record, setRecord] = useState<FanAppRecord | null>(null);
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!athleteId) return;
    let active = true;
    (async () => {
      const app = await fetchFanApp(athleteId);
      if (!active) return;
      setRecord(app);
      setSlug(app?.slug || slugify(appName || experience.brand.wordmark || "fan-app"));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  const live = record?.is_published ? record : null;
  const url = slug ? fanAppUrl(slug) : "";

  const publish = async () => {
    if (!athleteId) {
      setError("Sign in as an athlete to publish");
      return;
    }
    const clean = slugify(slug);
    if (clean.length < 3) {
      setError("Link name needs at least 3 characters");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await publishFanApp({
        athleteId,
        slug: clean,
        appName,
        config: experience,
        isPublished: true,
      });
      setRecord(saved);
      setSlug(saved?.slug || clean);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy failed — select the link manually");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
          <Globe size={13} className="text-[rgb(var(--theme-accent-rgb))]" />
          Share your app
        </p>
        {live ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            Live · {record?.view_count ?? 0} views
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Not published
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/60 px-2.5 py-2">
        <span className="text-[11px] text-white/35">/app/</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          onBlur={() => setSlug((v) => slugify(v))}
          placeholder="your-name"
          className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-white outline-none placeholder:text-white/25"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void publish()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--theme-accent-rgb))]/50 bg-[rgb(var(--theme-accent-rgb))]/15 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : live ? <RefreshCw size={12} /> : <Globe size={12} />}
          {live ? "Publish update" : "Publish app"}
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!live}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/70 disabled:opacity-40"
        >
          {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy link"}
        </button>
        {live ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/70"
          >
            <ExternalLink size={12} /> Open
          </a>
        ) : null}
      </div>

      {live ? <p className="mt-2 break-all text-[10px] text-white/35">{url}</p> : null}
      {error ? <p className="mt-2 text-[10px] text-red-300">{error}</p> : null}
    </div>
  );
}

export default FanAppPublishCard;
