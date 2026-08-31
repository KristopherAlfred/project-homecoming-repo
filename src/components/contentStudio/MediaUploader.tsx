import { useRef, useState } from "react";
import { Image as ImageIcon, Trash2, Upload, X, GripVertical, FolderOpen } from "lucide-react";
import { useContentStudio, type MediaAsset, type MediaKind } from "../../lib/contentStudio/store";

function kindFromFile(file: File): MediaKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/svg+xml" || file.type === "image/png") return "graphic";
  return "image";
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MediaThumb({ asset, className = "" }: { asset: MediaAsset; className?: string }) {
  if (asset.kind === "video") {
    return <video src={asset.url} muted className={`h-full w-full object-cover ${className}`} />;
  }
  if (asset.kind === "audio") {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-white/[0.05] ${className}`}>
        <span className="text-[10px] font-semibold text-white/60">AUDIO</span>
      </div>
    );
  }
  return <img src={asset.url} alt={asset.name} className={`h-full w-full object-cover ${className}`} />;
}

/** Drag-drop uploader + ordering for the composer's media slots. */
export function MediaUploader({
  mediaIds,
  onChange,
  onOpenLibrary,
}: {
  mediaIds: string[];
  onChange: (next: string[]) => void;
  onOpenLibrary: () => void;
}) {
  const { addMedia, mediaById } = useContentStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function ingest(files: FileList | null) {
    if (!files?.length) return;
    const payload = [] as Omit<MediaAsset, "id" | "createdAt">[];
    for (const file of Array.from(files).slice(0, 10)) {
      payload.push({ name: file.name, kind: kindFromFile(file), url: await fileToDataUrl(file) });
    }
    const created = addMedia(payload);
    onChange([...mediaIds, ...created.map((c) => c.id)]);
  }

  function reorder(from: number, to: number) {
    const next = [...mediaIds];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {mediaIds.map((id, index) => {
          const asset = mediaById.get(id);
          if (!asset) return null;
          return (
            <div
              key={id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              className="group relative h-[104px] w-[104px] overflow-hidden rounded-xl border border-dt-border bg-black/40"
            >
              <MediaThumb asset={asset} />
              <span className="absolute left-1 top-1 rounded bg-black/70 p-1 text-white/60 opacity-0 transition group-hover:opacity-100">
                <GripVertical size={12} />
              </span>
              <button
                type="button"
                aria-label="Remove asset"
                onClick={() => onChange(mediaIds.filter((m) => m !== id))}
                className="absolute right-1 top-1 rounded bg-black/75 p-1 text-white/80 transition hover:bg-dt-red hover:text-white"
              >
                <X size={12} />
              </button>
              {index === 0 && mediaIds.length > 1 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-white/80">
                  COVER
                </span>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void ingest(e.dataTransfer.files);
          }}
          className={`flex h-[104px] w-[104px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[10px] font-semibold transition ${
            dragOver ? "border-dt-red bg-dt-red/10 text-white" : "border-white/20 text-white/50 hover:border-white/40 hover:text-white"
          }`}
        >
          <Upload size={16} />
          Drop / upload
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
        >
          <ImageIcon size={13} /> Upload images or video
        </button>
        <button
          type="button"
          onClick={onOpenLibrary}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
        >
          <FolderOpen size={13} /> Select from Media Library
        </button>
        {mediaIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/50 transition hover:border-dt-red/40 hover:text-dt-red"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          void ingest(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Library picker used from the composer. */
export function MediaPicker({
  open,
  onClose,
  onPick,
  selectedIds,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (ids: string[]) => void;
  selectedIds: string[];
}) {
  const { media } = useContentStudio();
  const [picked, setPicked] = useState<string[]>(selectedIds);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="dt-surface w-full max-w-3xl rounded-2xl border border-dt-border bg-dt-card">
        <div className="flex items-center justify-between border-b border-dt-border px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Media Library</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {media.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-dt-muted">
              No media yet — upload assets from the composer or the Media Library page.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {media.map((asset) => {
                const active = picked.includes(asset.id);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() =>
                      setPicked(active ? picked.filter((id) => id !== asset.id) : [...picked, asset.id])
                    }
                    className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                      active ? "border-dt-red ring-2 ring-dt-red/40" : "border-dt-border hover:border-white/30"
                    }`}
                  >
                    <MediaThumb asset={asset} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-dt-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-dt-border px-3 py-2 text-[12px] font-semibold text-white/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onPick(picked);
              onClose();
            }}
            className="rounded-lg bg-dt-red px-3 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
          >
            Use {picked.length || ""} asset{picked.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
