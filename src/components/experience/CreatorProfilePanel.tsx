import { Plus, Trash2 } from "lucide-react";

import type { CreatorFeaturedCard, CreatorProfile, CreatorSocialLink } from "../../lib/creatorProfile";

/**
 * The only editor for the link-in-bio landing page: swap video, photo, name,
 * handle, socials, follower count, bio and featured cards. No canvas tools.
 */

const PLATFORMS = ["tiktok", "x", "youtube", "facebook", "instagram", "twitch", "spotify", "custom"];

const inputCls =
  "w-full rounded-lg border border-white/12 bg-black/45 px-2.5 py-1.5 text-[12px] text-white outline-none placeholder:text-white/25 focus:border-white/30";
const labelCls = "mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function UploadRow({
  label,
  value,
  accept,
  onPick,
  onClear,
}: {
  label: string;
  value: string;
  accept: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:border-white/35">
          {value ? "Replace" : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = "";
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-white/55 hover:text-white"
          >
            Remove
          </button>
        ) : (
          <span className="text-[11px] text-white/35">None yet</span>
        )}
      </div>
    </div>
  );
}

export function CreatorProfilePanel({
  creator,
  onChange,
  onUpload,
}: {
  creator: CreatorProfile;
  onChange: (patch: Partial<CreatorProfile>) => void;
  /** Turns a picked file into a usable src (data URL / uploaded asset URL). */
  onUpload: (file: File, apply: (src: string) => void) => void;
}) {
  const patchSocial = (id: string, patch: Partial<CreatorSocialLink>) =>
    onChange({ socials: creator.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const patchCard = (id: string, patch: Partial<CreatorFeaturedCard>) =>
    onChange({ featured: creator.featured.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-black/35 p-4">
      <div>
        <h3 className="font-display text-sm font-extrabold text-white">Landing page</h3>
        <p className="mt-0.5 text-[11px] text-white/45">
          Cinematic link-in-bio: background video, profile, socials and featured cards.
        </p>
      </div>

      <div className="space-y-3">
        <UploadRow
          label="Background video (loops, muted)"
          value={creator.videoSrc}
          accept="video/*"
          onPick={(file) => onUpload(file, (src) => onChange({ videoSrc: src }))}
          onClear={() => onChange({ videoSrc: "" })}
        />
        <Field
          label="…or video URL"
          value={creator.videoSrc.startsWith("data:") ? "" : creator.videoSrc}
          onChange={(v) => onChange({ videoSrc: v })}
          placeholder="https://…/clip.mp4"
        />
        <UploadRow
          label="Video poster / fallback still"
          value={creator.videoPoster}
          accept="image/*"
          onPick={(file) => onUpload(file, (src) => onChange({ videoPoster: src }))}
          onClear={() => onChange({ videoPoster: "" })}
        />
        <UploadRow
          label="Profile photo"
          value={creator.photo}
          accept="image/*"
          onPick={(file) => onUpload(file, (src) => onChange({ photo: src }))}
          onClear={() => onChange({ photo: "" })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" value={creator.name} onChange={(v) => onChange({ name: v })} placeholder="Your name" />
        <Field label="Handle" value={creator.handle} onChange={(v) => onChange({ handle: v })} placeholder="@handle" />
        <Field
          label="Follower count"
          value={creator.followerCount}
          onChange={(v) => onChange({ followerCount: v })}
          placeholder="23.4M"
        />
        <Field
          label="Follower label"
          value={creator.followerLabel}
          onChange={(v) => onChange({ followerLabel: v })}
          placeholder="Total Followers"
        />
      </div>

      <label className="flex items-center gap-2 text-[12px] text-white/70">
        <input
          type="checkbox"
          checked={creator.verified}
          onChange={(e) => onChange({ verified: e.target.checked })}
        />
        Show verified badge
      </label>

      <Field label="Bio line" value={creator.bio} onChange={(v) => onChange({ bio: v })} placeholder="One-line bio" />
      <Field
        label="Secondary handle"
        value={creator.secondaryHandle}
        onChange={(v) => onChange({ secondaryHandle: v })}
        placeholder="@yourbrand"
      />

      {/* Socials */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={labelCls + " mb-0"}>Social icons</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/70 hover:text-white"
            onClick={() =>
              onChange({
                socials: [
                  ...creator.socials,
                  { id: `social_${Date.now().toString(36)}`, platform: "custom", url: "" },
                ],
              })
            }
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {creator.socials.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <select
                className={inputCls + " w-28"}
                value={s.platform}
                onChange={(e) => patchSocial(s.id, { platform: e.target.value })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="bg-black">
                    {p}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                value={s.url}
                placeholder="https://…"
                onChange={(e) => patchSocial(s.id, { url: e.target.value })}
              />
              <button
                type="button"
                className="shrink-0 text-white/35 hover:text-white"
                onClick={() => onChange({ socials: creator.socials.filter((x) => x.id !== s.id) })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured cards */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={labelCls + " mb-0"}>Featured cards</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/70 hover:text-white"
            onClick={() =>
              onChange({
                featured: [...creator.featured, { id: `card_${Date.now().toString(36)}`, image: "" }],
              })
            }
          >
            <Plus size={12} /> Add card
          </button>
        </div>
        <div className="space-y-3">
          {creator.featured.map((card) => (
            <div key={card.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-2">
                <UploadRow
                  label="Card art"
                  value={card.image}
                  accept="image/*"
                  onPick={(file) => onUpload(file, (src) => patchCard(card.id, { image: src }))}
                  onClear={() => patchCard(card.id, { image: "" })}
                />
                <button
                  type="button"
                  className="mt-4 shrink-0 text-white/35 hover:text-white"
                  onClick={() => onChange({ featured: creator.featured.filter((c) => c.id !== card.id) })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <Field
                label="Overlay title"
                value={card.overlayTitle ?? ""}
                onChange={(v) => patchCard(card.id, { overlayTitle: v })}
                placeholder="BIG TITLE"
              />
              <Field
                label="Caption"
                value={card.caption ?? ""}
                onChange={(v) => patchCard(card.id, { caption: v })}
                placeholder="Card caption"
              />
              <Field
                label="Link"
                value={card.url ?? ""}
                onChange={(v) => patchCard(card.id, { url: v })}
                placeholder="https://…"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreatorProfilePanel;
