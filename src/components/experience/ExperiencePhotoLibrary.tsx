import { useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { useExperiencePhotoLibrary } from "../../lib/experiencePhotoLibrary";
import { resolveAssetUrl } from "../../lib/homeLayoutApi";

type PhotoSlot = "heroImage" | "backgroundImage" | "titleImage";

const SLOTS: { id: PhotoSlot; label: string }[] = [
  { id: "heroImage", label: "Hero photo" },
  { id: "backgroundImage", label: "Background" },
  { id: "titleImage", label: "Title art" },
];

/**
 * The athlete's own photo library: headshot, connected Instagram posts, video
 * thumbnails and studio uploads. Pick a slot, click a photo — it drops into the
 * current page as an independent, editable layer.
 */
export function ExperiencePhotoLibrary({
  pageLabel,
  onApply,
  onUpload,
}: {
  pageLabel: string;
  onApply: (slot: PhotoSlot, src: string) => void;
  onUpload: (file: File) => void;
}) {
  const { items, loading, removeUpload } = useExperiencePhotoLibrary();
  const [slot, setSlot] = useState<PhotoSlot>("heroImage");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Your photos
          </p>
          <p className="text-[11px] text-white/40">
            Headshot, Instagram, videos & uploads → {pageLabel}
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-white/40 hover:text-white">
          <ImagePlus size={12} /> Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {SLOTS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSlot(option.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition ${
              slot === option.id
                ? "bg-dt-red text-white"
                : "border border-white/12 text-white/45 hover:text-white/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && !items.length ? (
        <p className="flex items-center gap-2 py-4 text-[11px] text-white/40">
          <Loader2 size={12} className="animate-spin" /> Loading your photos…
        </p>
      ) : null}

      {!loading && !items.length ? (
        <p className="py-3 text-[11px] text-white/40">
          No photos yet — upload one, or connect Instagram to pull your own posts in.
        </p>
      ) : null}

      {items.length ? (
        <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => onApply(slot, item.src)}
                title={`${item.label} → ${SLOTS.find((s) => s.id === slot)?.label}`}
                className="block w-full overflow-hidden rounded-lg border border-white/12 transition hover:border-[rgb(var(--theme-accent-rgb))]"
              >
                <img
                  src={resolveAssetUrl(item.src)}
                  alt={item.label}
                  loading="lazy"
                  className="h-16 w-full object-cover"
                />
              </button>
              {item.source === "upload" ? (
                <button
                  type="button"
                  onClick={() => removeUpload(item.id)}
                  title="Remove from library"
                  className="absolute right-1 top-1 hidden rounded-full bg-black/75 p-1 text-white/70 hover:text-white group-hover:block"
                >
                  <Trash2 size={9} />
                </button>
              ) : null}
              <p className="mt-0.5 truncate text-[8px] uppercase tracking-[0.08em] text-white/35">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
