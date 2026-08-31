import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Palette, Send, Sparkles, Wand2, X } from "lucide-react";
import {
  applyExperiencePatch,
  askExperienceDesigner,
  describePatch,
  designerConfigSnapshot,
  generateExperienceArt,
  type DesignerMessage,
} from "../../lib/experienceAi";
import { EXPERIENCE_LOOKS } from "../../lib/experienceLooks";
import type { ExperienceConfig } from "../../lib/experienceConfig";

type PageKey = keyof ExperienceConfig["pages"];

const QUICK_PROMPTS = [
  "Make the whole app look like a premium night-game broadcast",
  "Match my team colors and make the CTA pop",
  "Rewrite my landing headline and subhead to hype my fan app",
  "Make it feel expensive: less glow, more contrast, tighter buttons",
  "Give it a neon streetwear vibe with animated gradients",
  "Clean minimal blackout look with white text only",
  "Remove every glow and shadow in the app",
  "Add buttons for my shop, tickets and highlights",
  "Generate a cinematic background image that matches my colors and place it",
  "Delete the tagline and title art, then rebalance the layout",
  "Redesign the whole app 10x better — colors, type, layout and buttons",

];

/** Dominant colors from an uploaded reference image (client-side, no upload). */
async function extractPalette(dataUrl: string, count = 5): Promise<string[]> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    buckets.set(key, { r: cur.r + r, g: cur.g + g, b: cur.b + b, n: cur.n + 1 });
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map(({ r, g, b, n }) => {
      const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
      return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
    });
}

/** Downscale + compress an uploaded image so it can be stored in the layout config. */
async function compressDataUrl(dataUrl: string, maxEdge = 1400, quality = 0.82): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", quality);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read file")));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function ExperienceAiDesigner({
  experience,
  pageKey,
  context,
  onApply,
  onSetPageImage,
  onStatus,
  onError,
}: {
  experience: ExperienceConfig;
  pageKey: PageKey;
  context: { fanAppName: string; athlete: string; sport?: string; team?: string };
  onApply: (next: (prev: ExperienceConfig) => ExperienceConfig, note: string) => void;
  onSetPageImage: (field: "backgroundImage" | "heroImage" | "titleImage", dataUrl: string) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [messages, setMessages] = useState<DesignerMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [artPrompt, setArtPrompt] = useState("");
  const [artTarget, setArtTarget] = useState<"backgroundImage" | "heroImage" | "titleImage">("backgroundImage");
  const [makingArt, setMakingArt] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [busy]);

  async function attach(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachment(dataUrl);
      setPalette(await extractPalette(dataUrl));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not read that image");
    }
  }

  async function send(text: string) {
    const instruction = text.trim();
    if ((!instruction && !attachment) || busy) return;
    const history = messages;
    const image = attachment;
    setMessages([...history, { role: "user", content: instruction || "Restyle from this image", image: image ?? undefined }]);
    setPrompt("");
    setAttachment(null);
    setPalette([]);
    setBusy(true);
    try {
      const result = await askExperienceDesigner({
        instruction,
        pageKey,
        image,
        config: designerConfigSnapshot(experience, pageKey),
        context,
        history,
      });
      const changed = describePatch(result.patch);
      if (changed.length) {
        onApply(
          (prev) => applyExperiencePatch(prev, result.patch, pageKey, result.applyToAllPages),
          result.reply,
        );
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: changed.length
            ? `${result.reply}\n\nChanged → ${changed.join(" · ")}${result.applyToAllPages ? "\nApplied to every page." : ""}`
            : result.reply,
        },
      ]);
      if (result.imagePrompt) {
        setArtPrompt(result.imagePrompt);
        setArtTarget(result.imageTarget);
        await makeArt(result.imagePrompt, result.imageTarget);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "The designer could not respond";
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setBusy(false);
    }
  }

  async function makeArt(promptOverride?: string, targetOverride?: typeof artTarget) {
    const p = (promptOverride ?? artPrompt).trim();
    const target = targetOverride ?? artTarget;
    if (!p || makingArt) return;
    setMakingArt(true);
    try {
      const src = await generateExperienceArt(p);
      onSetPageImage(target, src);
      onStatus("Artwork generated and placed — publish to push live");
      if (promptOverride) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Generated artwork and placed it as the ${target.replace("Image", "")} image.`, image: src },
        ]);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not generate the artwork");
    } finally {
      setMakingArt(false);
    }
  }


  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dt-red/30 bg-gradient-to-br from-dt-red/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-dt-red/20 text-dt-red">
            <Wand2 size={17} />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-white">AI design studio</p>
            <p className="text-[11px] text-white/50">
              Describe the look you want — or drop a reference image — and it restyles {context.fanAppName}.
            </p>
          </div>
        </div>
      </div>

      {/* One-tap looks */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">One-tap looks</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXPERIENCE_LOOKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onApply((prev) => applyExperiencePatch(prev, item.patch, pageKey, true), `${item.label} look applied`);
                onStatus(`${item.label} look applied — publish to push live`);
              }}
              className="group overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2.5 text-left transition hover:-translate-y-0.5 hover:border-dt-red/50"
            >
              <div className="flex gap-1">
                {item.swatch.map((c) => (
                  <span key={c} className="h-6 flex-1 rounded-md" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-white">{item.label}</p>
              <p className="text-[10px] text-white/45">{item.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-black/30">
        <div ref={threadRef} className="max-h-[320px] min-h-[160px] space-y-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-white/50">Try one of these, or write your own:</p>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-xs text-white/75 transition hover:border-dt-red/40 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-xs ${
                  m.role === "user" ? "ml-6 bg-dt-red text-white" : "mr-6 border border-white/10 bg-black/40 text-white/85"
                }`}
              >
                {m.image ? (
                  <img src={m.image} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />
                ) : null}
                {m.content}
              </div>
            ))
          )}
          {busy ? (
            <p className="mr-6 flex items-center gap-1.5 text-xs text-white/50">
              <Loader2 size={12} className="animate-spin" /> Designing…
            </p>
          ) : null}
        </div>

        {attachment ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-dt-border px-3 py-2">
            <img src={attachment} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-white/60">Image attached</p>
              <div className="mt-1 flex gap-1">
                {palette.map((c) => (
                  <span key={c} className="h-4 w-4 rounded" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Use in app</span>
              {(
                [
                  ["backgroundImage", "Background"],
                  ["heroImage", "Hero art"],
                  ["titleImage", "Title art"],
                ] as const
              ).map(([field, label]) => (
                <button
                  key={field}
                  type="button"
                  onClick={async () => {
                    try {
                      const src = await compressDataUrl(attachment);
                      onSetPageImage(field, src);
                      onStatus(`Your image is now the ${label.toLowerCase()}`);
                      setAttachment(null);
                      setPalette([]);
                    } catch (err) {
                      onError(err instanceof Error ? err.message : "Could not use that image");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 hover:border-dt-red/50 hover:text-white"
                >
                  <ImagePlus size={12} /> {label}
                </button>
              ))}
            </div>

            {palette.length ? (
              <button
                type="button"
                onClick={() => {
                  const [a, b, c] = palette;
                  onApply(
                    (prev) =>
                      applyExperiencePatch(
                        prev,
                        {
                          theme: { accent: a, accentHover: b || a, buttonBg: a, bgGradientVia: c || prev.theme.bgGradientVia },
                          effects: { glowColor: a, particleColor: a },
                          page: { accentColor: a, ctaBg: a },
                          brand: { logoColor: a, taglineColor: a },
                        },
                        pageKey,
                        true,
                      ),
                    "Palette pulled from your image",
                  );
                  onStatus("Palette applied from your image");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 hover:border-dt-red/50 hover:text-white"
              >
                <Palette size={13} /> Use palette
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Remove reference"
              onClick={() => {
                setAttachment(null);
                setPalette([]);
              }}
              className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(prompt);
          }}
          onDrop={(e) => {
            e.preventDefault();
            void attach(e.dataTransfer.files?.[0] ?? null);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-end gap-2 border-t border-dt-border p-3"
        >
          <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:border-dt-red/50 hover:text-white">
            <ImagePlus size={15} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void attach(e.target.files?.[0] ?? null)}
            />
          </label>
          <textarea
            ref={inputRef}
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(prompt);
              }
            }}
            placeholder="e.g. make the landing page look like a late-night playoff game, gold accents"
            className="min-h-[42px] flex-1 resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-dt-red/55"
          />
          <button
            type="submit"
            disabled={busy || (!prompt.trim() && !attachment)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dt-red text-white transition hover:brightness-110 disabled:opacity-40"
            aria-label="Send to designer"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
      </div>

      {/* AI artwork */}
      <div className="space-y-2 rounded-2xl border border-dt-border bg-dt-card p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
          <Sparkles size={13} className="text-dt-red" /> Generate artwork
        </p>
        <textarea
          rows={2}
          value={artPrompt}
          onChange={(e) => setArtPrompt(e.target.value)}
          placeholder="e.g. moody arena tunnel with red haze, cinematic, no text"
          className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-dt-red/55"
        />
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["backgroundImage", "Background"],
              ["heroImage", "Hero art"],
              ["titleImage", "Title art"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setArtTarget(value)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                artTarget === value ? "bg-dt-red text-white" : "border border-white/15 text-white/65 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void makeArt()}
            disabled={makingArt || !artPrompt.trim()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            {makingArt ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {makingArt ? "Generating…" : "Generate & place"}
          </button>
        </div>
      </div>
    </div>
  );
}
