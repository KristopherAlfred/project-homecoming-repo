import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, MousePointerClick } from "lucide-react";
import { PageShell, Panel, StatCard } from "../components/PageShell";
import { useAthlete } from "../contexts/AthleteContext";
import {
  SLUG_PATTERN,
  claimBioSlug,
  isSlugAvailable,
  slugify,
} from "../lib/athletes";

/**
 * Bio link builder. Each athlete claims one short slug that funnels their
 * social traffic into their fan app.
 */
export function BioLinkPage() {
  const { athlete, bioLink, fanAppName, displayName, loading, refresh } = useAthlete();

  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState("");
  const [published, setPublished] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    setSlug(bioLink?.slug ?? slugify(displayName));
    setDestination(bioLink?.destination_app_url ?? "");
    setPublished(bioLink?.is_published ?? false);
  }, [loading, bioLink, displayName]);

  const publicUrl = useMemo(
    () => `${window.location.origin}/go/${slug || "your-name"}`,
    [slug],
  );

  useEffect(() => {
    const clean = slug.trim().toLowerCase();
    if (!clean) return setStatus("idle");
    if (!SLUG_PATTERN.test(clean)) return setStatus("invalid");
    if (clean === bioLink?.slug) return setStatus("free");

    let active = true;
    setStatus("checking");
    const timer = window.setTimeout(async () => {
      const free = await isSlugAvailable(clean, athlete?.id);
      if (active) setStatus(free ? "free" : "taken");
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [slug, athlete?.id, bioLink?.slug]);

  async function save() {
    if (!athlete || saving || status !== "free") return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await claimBioSlug(athlete.id, slug.trim().toLowerCase(), {
        destination_app_url: destination.trim() || undefined,
        is_published: published,
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your bio link");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const statusCopy: Record<typeof status, string> = {
    idle: "Pick a short, memorable handle.",
    checking: "Checking availability…",
    free: "Available — this one is yours.",
    taken: "Another athlete already claimed this handle.",
    invalid: "Use 3–40 lowercase letters, numbers or hyphens.",
  };

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Total clicks"
            value={(bioLink?.click_count ?? 0).toLocaleString()}
            hint="Visits sent to your fan app"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Status"
            value={bioLink?.is_published ? "Live" : "Draft"}
            hint={bioLink ? `/go/${bioLink.slug}` : "Not claimed yet"}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard label="Destination" value={fanAppName} hint="Where fans land" />
        </div>
      </div>

      <Panel title="Your bio link">
        <div className="space-y-4 p-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-dt-muted">
              Handle
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-dt-border bg-black/40 px-3 py-2">
              <Link2 size={14} className="shrink-0 text-dt-muted" />
              <span className="shrink-0 text-xs text-dt-muted">{window.location.host}/go/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="your-name"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
              {status === "checking" ? <Loader2 size={14} className="animate-spin text-dt-muted" /> : null}
            </div>
            <p
              className={`mt-1.5 text-xs ${
                status === "free"
                  ? "text-dt-green"
                  : status === "taken" || status === "invalid"
                    ? "text-dt-red"
                    : "text-dt-muted"
              }`}
            >
              {statusCopy[status]}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-dt-muted">
              Destination (optional)
            </label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://your-fan-app.com — leave blank to use your app experience"
              className="mt-1.5 w-full rounded-lg border border-dt-border bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-dt-red/50"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 accent-dt-red"
            />
            Publish this link so fans can use it
          </label>

          {error ? (
            <p className="rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2 text-xs text-dt-red">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!athlete || saving || status !== "free"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-dt-red px-3.5 py-2 text-xs font-semibold text-dt-bg transition hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {saving ? "Saving…" : saved ? "Saved" : "Save bio link"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:border-dt-red/40 hover:text-white"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {bioLink?.slug ? (
              <a
                href={`/go/${bioLink.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:border-dt-red/40 hover:text-white"
              >
                <ExternalLink size={13} />
                Preview
              </a>
            ) : null}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-dt-muted">
            <MousePointerClick size={13} />
            Put {publicUrl} in your social bios — every tap is counted here.
          </p>
        </div>
      </Panel>
    </PageShell>
  );
}
