import { Play } from "lucide-react";
import { contentThumbs } from "../data/contentThumbs";

export function ContentThumb({
  id,
  size = "md",
}: {
  id: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-14" : "h-10 w-16";
  const meta = contentThumbs[id];

  if (!meta) {
    return (
      <div
        className={`${dim} shrink-0 rounded border border-dt-border bg-zinc-800`}
      />
    );
  }

  return (
    <div className={`${dim} relative shrink-0 overflow-hidden rounded border border-dt-border`}>
      <img
        src={meta.src}
        alt=""
        className="h-full w-full object-cover object-center"
      />
      {meta.isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Play
            size={size === "sm" ? 10 : 14}
            className="fill-white text-white"
          />
        </div>
      )}
    </div>
  );
}
