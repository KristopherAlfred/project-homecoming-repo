import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { PlatformSelector } from "./PlatformSelector";
import { MediaPicker, MediaUploader } from "./MediaUploader";
import { PostPreview } from "./PostPreview";
import { ProfilePreview } from "./ProfilePreview";
import {
  CONTENT_TYPES,
  PLATFORMS,
  supportsContentType,
  type ContentType,
  type StudioPlatformKey,
} from "../../lib/contentStudio/platforms";
import {
  blankContent,
  resolveVariant,
  useContentStudio,
  useWorkspaceId,
  type ContentRecord,
} from "../../lib/contentStudio/store";

const STEPS = ["Content", "Platforms", "Customize", "Schedule", "Review"] as const;

function StepBar({ step, onJump }: { step: number; onJump: (index: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, index) => {
        const active = index === step;
        const done = index < step;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onJump(index)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              active
                ? "border-dt-red bg-dt-red/15 text-white"
                : done
                  ? "border-dt-green/35 bg-dt-green/10 text-dt-green"
                  : "border-dt-border text-white/45 hover:text-white/80"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[9px]">
              {done ? <Check size={9} strokeWidth={3} /> : index + 1}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">{label}</span>
        {hint && <span className="text-[10px] text-dt-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-dt-border bg-black/40 px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-dt-red/60 focus:outline-none";

/** 5-step create flow: content → platforms → per-platform tuning → schedule → review. */
export function ContentComposer({
  initial,
  onDone,
}: {
  initial?: ContentRecord;
  onDone?: () => void;
}) {
  const workspaceId = useWorkspaceId();
  const { saveContent, publishNow } = useContentStudio();
  const [record, setRecord] = useState<ContentRecord>(() => initial ?? blankContent(workspaceId));
  const [step, setStep] = useState(0);
  const [previewPlatform, setPreviewPlatform] = useState<StudioPlatformKey>(
    initial?.platforms[0] ?? "fanapp",
  );
  const [previewMode, setPreviewMode] = useState<"post" | "profile">("post");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const patch = (next: Partial<ContentRecord>) => setRecord((prev) => ({ ...prev, ...next }));

  function patchVariant(platform: StudioPlatformKey, next: Record<string, unknown>) {
    setRecord((prev) => ({
      ...prev,
      variants: { ...prev.variants, [platform]: { ...(prev.variants[platform] ?? {}), ...next } },
    }));
  }

  const activePlatforms = useMemo(
    () => record.platforms.filter((p) => supportsContentType(p, record.contentType)),
    [record.platforms, record.contentType],
  );

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (record.mediaIds.length === 0 && record.contentType !== "post") {
      list.push("This content type usually needs at least one media asset.");
    }
    for (const platform of activePlatforms) {
      const limit = PLATFORMS[platform].captionLimit;
      const variant = resolveVariant(record, platform);
      const length = `${variant.caption} ${variant.hashtags}`.trim().length;
      if (limit && length > limit) {
        list.push(`${PLATFORMS[platform].label}: caption is ${length - limit} characters over the ${limit} limit.`);
      }
      if ((platform === "youtube" || platform === "spotify") && !variant.title.trim()) {
        list.push(`${PLATFORMS[platform].label}: a title is required.`);
      }
      if ((platform === "instagram" || platform === "tiktok") && variant.mediaIds.length === 0) {
        list.push(`${PLATFORMS[platform].label}: media is required.`);
      }
    }
    return list;
  }, [record, activePlatforms]);

  const canAdvance =
    step === 0
      ? Boolean(record.caption.trim() || record.title.trim() || record.mediaIds.length)
      : step === 1
        ? activePlatforms.length > 0
        : true;

  function save(nextStatus: ContentRecord["status"], scheduledAt = record.scheduledAt) {
    const saved = saveContent({ ...record, status: nextStatus, scheduledAt });
    setRecord(saved);
    return saved;
  }

  return (
    <div className="space-y-5">
      <StepBar step={step} onJump={(index) => setStep(Math.min(index, STEPS.length - 1))} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {step === 0 && (
            <section className="dt-surface space-y-4 rounded-2xl border border-dt-border bg-dt-card p-4">
              <Field label="Content type">
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => patch({ contentType: type.key as ContentType })}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        record.contentType === type.key
                          ? "border-dt-red bg-dt-red/12 text-white"
                          : "border-dt-border text-white/55 hover:text-white"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Title / headline" hint="Used by YouTube, Twitch, Spotify and the Fan App">
                <input
                  className={inputClass}
                  value={record.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Give this content a title"
                />
              </Field>

              <Field label="Caption" hint={`${record.caption.length} characters`}>
                <textarea
                  className={`${inputClass} min-h-[130px] resize-y`}
                  value={record.caption}
                  onChange={(e) => patch({ caption: e.target.value })}
                  placeholder="Write the caption once — you can tailor it per platform in the next steps."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hashtags">
                  <input
                    className={inputClass}
                    value={record.hashtags}
                    onChange={(e) => patch({ hashtags: e.target.value })}
                    placeholder="#gameday #behindthescenes"
                  />
                </Field>
                <Field label="Link">
                  <input
                    className={inputClass}
                    value={record.link}
                    onChange={(e) => patch({ link: e.target.value })}
                    placeholder="https://"
                  />
                </Field>
              </div>

              <Field label="Media">
                <MediaUploader
                  mediaIds={record.mediaIds}
                  onChange={(mediaIds) => patch({ mediaIds })}
                  onOpenLibrary={() => setPickerOpen(true)}
                />
              </Field>
            </section>
          )}

          {step === 1 && (
            <section className="dt-surface rounded-2xl border border-dt-border bg-dt-card p-4">
              <PlatformSelector
                selected={record.platforms}
                onChange={(platforms) => {
                  patch({ platforms });
                  if (platforms.length && !platforms.includes(previewPlatform)) {
                    setPreviewPlatform(platforms[0]);
                  }
                }}
                contentType={record.contentType}
              />
            </section>
          )}

          {step === 2 && (
            <section className="dt-surface space-y-4 rounded-2xl border border-dt-border bg-dt-card p-4">
              <div className="flex flex-wrap gap-2">
                {activePlatforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setPreviewPlatform(platform)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      previewPlatform === platform
                        ? "border-dt-red bg-dt-red/12 text-white"
                        : "border-dt-border text-white/55 hover:text-white"
                    }`}
                  >
                    <PlatformIcon platform={platform} size={13} />
                    {PLATFORMS[platform].label}
                    {resolveVariant(record, platform).customized && (
                      <span className="rounded bg-white/10 px-1 text-[9px]">edited</span>
                    )}
                  </button>
                ))}
              </div>

              {activePlatforms.includes(previewPlatform) ? (
                <div className="space-y-4">
                  <p className="text-[11px] text-dt-muted">
                    Leave a field untouched to inherit the master content. Overrides only affect{" "}
                    {PLATFORMS[previewPlatform].label}.
                  </p>

                  {(previewPlatform === "youtube" ||
                    previewPlatform === "twitch" ||
                    previewPlatform === "spotify" ||
                    previewPlatform === "fanapp") && (
                    <Field label={`${PLATFORMS[previewPlatform].label} title`}>
                      <input
                        className={inputClass}
                        value={resolveVariant(record, previewPlatform).title}
                        onChange={(e) => patchVariant(previewPlatform, { title: e.target.value })}
                      />
                    </Field>
                  )}

                  <Field
                    label="Caption / description"
                    hint={
                      `${resolveVariant(record, previewPlatform).caption.length} / ${PLATFORMS[previewPlatform].captionLimit}`
                    }
                  >
                    <textarea
                      className={`${inputClass} min-h-[120px] resize-y`}
                      value={resolveVariant(record, previewPlatform).caption}
                      onChange={(e) => patchVariant(previewPlatform, { caption: e.target.value })}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Hashtags">
                      <input
                        className={inputClass}
                        value={resolveVariant(record, previewPlatform).hashtags}
                        onChange={(e) => patchVariant(previewPlatform, { hashtags: e.target.value })}
                      />
                    </Field>
                    <Field label="Call to action">
                      <input
                        className={inputClass}
                        value={resolveVariant(record, previewPlatform).cta}
                        onChange={(e) => patchVariant(previewPlatform, { cta: e.target.value })}
                        placeholder="Watch now, Join the circle…"
                      />
                    </Field>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRecord((prev) => {
                        const variants = { ...prev.variants };
                        delete variants[previewPlatform];
                        return { ...prev, variants };
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:text-white"
                  >
                    <Wand2 size={12} /> Reset to master content
                  </button>
                </div>
              ) : (
                <p className="text-[12px] text-dt-muted">Select a destination in the previous step first.</p>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="dt-surface space-y-4 rounded-2xl border border-dt-border bg-dt-card p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date & time">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={record.scheduledAt ? record.scheduledAt.slice(0, 16) : ""}
                    onChange={(e) =>
                      patch({
                        scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </Field>
                <Field label="Timezone">
                  <input className={inputClass} value={record.timezone} readOnly />
                </Field>
              </div>
              <p className="text-[11px] text-dt-muted">
                Leave the date empty to publish immediately from the review step.
              </p>
            </section>
          )}

          {step === 4 && (
            <section className="dt-surface space-y-4 rounded-2xl border border-dt-border bg-dt-card p-4">
              <div className="space-y-2">
                {activePlatforms.map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center gap-3 rounded-xl border border-dt-border bg-black/30 px-3 py-2.5"
                  >
                    <PlatformIcon platform={platform} size={16} />
                    <span className="flex-1 text-[12px] font-semibold text-white">
                      {PLATFORMS[platform].label}
                    </span>
                    <span className="text-[11px] text-dt-muted">
                      {record.scheduledAt
                        ? new Date(record.scheduledAt).toLocaleString()
                        : "Publish immediately"}
                    </span>
                  </div>
                ))}
              </div>

              {warnings.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-3">
                  {warnings.map((warning) => (
                    <p key={warning} className="flex items-start gap-2 text-[11px] text-amber-300">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {warning}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    save("draft");
                    setStatus("Saved as draft.");
                  }}
                  className="rounded-xl border border-dt-border px-3.5 py-2 text-[12px] font-semibold text-white/75 transition hover:text-white"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={!record.scheduledAt}
                  onClick={() => {
                    save("scheduled");
                    setStatus("Scheduled.");
                    onDone?.();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dt-border px-3.5 py-2 text-[12px] font-semibold text-white/75 transition hover:text-white disabled:opacity-40"
                >
                  <CalendarClock size={13} /> Schedule
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const saved = save("publishing");
                    publishNow(saved.id);
                    setStatus("Publishing to your connected accounts…");
                    onDone?.();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-dt-red px-3.5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                >
                  <Send size={13} /> Publish now
                </button>
              </div>
              {status && <p className="text-[11px] text-dt-green">{status}</p>}
            </section>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dt-border px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:text-white disabled:opacity-30"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <button
              type="button"
              disabled={step === STEPS.length - 1 || !canAdvance}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-white/15 disabled:opacity-30"
            >
              Continue <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
              <Sparkles size={13} style={{ color: "var(--theme-accent)" }} /> Live preview
            </h3>
            <div className="flex rounded-lg border border-dt-border p-0.5">
              {(["post", "profile"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold capitalize transition ${
                    previewMode === mode ? "bg-white/12 text-white" : "text-white/50"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(activePlatforms.length ? activePlatforms : (["fanapp"] as StudioPlatformKey[])).map(
              (platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setPreviewPlatform(platform)}
                  aria-label={PLATFORMS[platform].label}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                    previewPlatform === platform
                      ? "border-dt-red bg-dt-red/12"
                      : "border-dt-border hover:border-white/25"
                  }`}
                >
                  <PlatformIcon platform={platform} size={15} />
                </button>
              ),
            )}
          </div>

          {previewMode === "post" ? (
            <PostPreview record={record} platform={previewPlatform} />
          ) : (
            <ProfilePreview record={record} platform={previewPlatform} />
          )}
        </aside>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedIds={record.mediaIds}
        onPick={(mediaIds) => patch({ mediaIds })}
      />
    </div>
  );
}
