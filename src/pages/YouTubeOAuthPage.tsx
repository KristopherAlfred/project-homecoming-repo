import { useEffect, useState } from "react";

/**
 * Landing page for the Google/YouTube OAuth popup. It never asks the user to do
 * anything: it shows a "Connecting YouTube" screen, flips to "Connected", tells
 * the opener, and closes itself.
 */
export default function YouTubeOAuthPage() {
  const params = new URLSearchParams(window.location.search);
  const ok = (params.get("youtube") ?? "connected") === "connected";
  const message = params.get("youtube_message") ?? "";
  const [phase, setPhase] = useState<"connecting" | "done">("connecting");

  useEffect(() => {
    const toDone = window.setTimeout(() => setPhase("done"), 700);
    const notify = window.setTimeout(() => {
      try {
        window.opener?.postMessage({ type: "youtube-auth", ok, message }, "*");
      } catch {
        // opener may be gone
      }
      window.close();
    }, 1400);
    return () => {
      window.clearTimeout(toDone);
      window.clearTimeout(notify);
    };
  }, [ok, message]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        {phase === "connecting" || !ok ? null : (
          <div className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {phase === "connecting" && (
          <div className="size-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        )}
        <h1 className="text-lg font-semibold">
          {!ok ? "Couldn’t connect YouTube" : phase === "connecting" ? "Connecting YouTube…" : "YouTube connected"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {!ok ? message || "Please try again." : "Bringing you back to your dashboard."}
        </p>
      </div>
    </main>
  );
}
