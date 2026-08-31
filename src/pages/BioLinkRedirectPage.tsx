import { useEffect, useState } from "react";
import { useParams } from "@/lib/router-compat";
import { registerBioLinkClick } from "../lib/athletes";

/**
 * Public bio-link redirect: /go/:slug counts the visit, then forwards the fan
 * to the athlete's fan app destination.
 */
export function BioLinkRedirectPage() {
  const { slug = "" } = useParams();
  const [state, setState] = useState<"loading" | "missing">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await registerBioLinkClick(slug);
        const destination = result?.destination_app_url?.trim();
        if (!result?.is_published || !destination) throw new Error("unavailable");
        if (!active) return;
        if (/^https?:\/\//i.test(destination)) window.location.replace(destination);
        else window.location.replace(destination.startsWith("/") ? destination : `/${destination}`);
      } catch {
        if (active) setState("missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-dt-bg px-6 text-center">
      <h1 className="font-display text-xl font-semibold text-white">
        {state === "loading" ? "Taking you there…" : "This link isn’t active"}
      </h1>
      <p className="max-w-sm text-sm text-dt-muted">
        {state === "loading"
          ? "One moment while we open the fan app."
          : "The athlete hasn’t published this bio link yet. Double-check the handle and try again."}
      </p>
    </main>
  );
}
