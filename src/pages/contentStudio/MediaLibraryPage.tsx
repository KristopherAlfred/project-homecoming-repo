import { useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Send, Trash2, Upload } from "lucide-react";
import { PageShell } from "../../components/PageShell";
import { MediaThumb } from "../../components/contentStudio/MediaUploader";
import { useContentStudio, type MediaAsset, type MediaKind } from "../../lib/contentStudio/store";

const KINDS: (MediaKind | "all")[] = ["all", "image", "video", "gif", "graphic", "audio"];

function kindFromFile(file: File): MediaKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "image/gif") return "gif";
  return "image";
}

export function MediaLibraryPage() {
  const navigate = useNavigate();
  const { media, addMedia, removeMedia, renameMedia } = useContentStudio();
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const rows = media.filter((asset) => kind === "all" || asset.kind === kind);

  async function ingest(files: FileList | null) {
    if (!files?.length) return;
    const payload: Omit<MediaAsset, "id" | "createdAt">[] = [];
    for (const file of Array.from(files)) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      payload.push({ name: file.name, kind: kindFromFile(file), url });
    }
    addMedia(payload);
  }

  return (
    <PageShell
      actions={
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-dt-red px-3.5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
        >
          <Upload size={14} /> Upload media
        </button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setKind(key)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                kind === key
                  ? "border-dt-red bg-dt-red/12 text-white"
                  : "border-dt-border text-white/55 hover:text-white"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/studio/create")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/75 hover:text-white"
            >
              <Send size={12} /> Use in new post
            </button>
            <button
              type="button"
              onClick={() => {
                removeMedia(selected);
                setSelected([]);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/60 hover:border-dt-red/40 hover:text-dt-red"
            >
              <Trash2 size={12} /> Delete {selected.length}
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="dt-surface rounded-2xl border border-dt-border bg-dt-card px-4 py-16 text-center">
          <p className="text-[13px] font-semibold text-white">Your media library is empty</p>
          <p className="mt-1 text-[12px] text-dt-muted">
            Upload photos, video, or graphics to reuse them across every destination.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((asset) => {
            const active = selected.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`dt-surface overflow-hidden rounded-2xl border bg-dt-card transition ${
                  active ? "border-dt-red ring-2 ring-dt-red/35" : "border-dt-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelected(active ? selected.filter((id) => id !== asset.id) : [...selected, asset.id])
                  }
                  className="block aspect-square w-full"
                >
                  <MediaThumb asset={asset} />
                </button>
                <div className="space-y-1 px-2.5 py-2">
                  <input
                    value={asset.name}
                    onChange={(e) => renameMedia(asset.id, e.target.value)}
                    className="w-full truncate bg-transparent text-[11px] font-semibold text-white focus:outline-none"
                  />
                  <p className="text-[10px] uppercase tracking-wide text-dt-muted">
                    {asset.kind} · {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </PageShell>
  );
}
