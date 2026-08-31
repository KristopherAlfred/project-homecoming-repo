/**
 * AI design copilot for the Experience studio.
 *
 * action: "design" -> takes the current experience config (brand/theme/effects +
 *   the page being edited), a natural-language instruction and an optional
 *   reference image, and returns a JSON patch the client deep-merges into the
 *   config, plus a short human reply.
 * action: "image"  -> generates artwork (background / hero / logo) as a data URL.
 *
 * All model calls and keys stay server-side.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const TEXT_MODEL = "google/gemini-3.6-flash";
const IMAGE_MODEL = "google/gemini-3.1-flash-image";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

const SCHEMA_DOC = `
The full experience config you may patch (all fields optional — send ONLY what changes):
{
  "brand": { "logoColor": hex, "logoTint": bool, "wordmark": string, "wordmarkColor": hex,
             "wordmarkFontFamily": font, "tagline": string, "taglineColor": hex, "showLogoImage": bool },
  "theme": { "bg": hex, "bgGradientFrom": hex, "bgGradientVia": hex, "bgGradientTo": hex,
             "bgGradientAngle": 0-360, "useGradientBg": bool, "surface": hex, "card": hex,
             "border": css color, "text": hex, "muted": css color, "accent": hex,
             "accentHover": hex, "buttonBg": hex, "buttonText": hex, "buttonBorder": css color,
             "buttonRadius": 0-999, "fontDisplay": font, "fontBody": font },
  "effects": { "glow": bool, "glowColor": hex, "glowIntensity": 0-100, "particles": bool,
               "particleColor": hex, "noise": bool, "noiseOpacity": 0-40, "shimmer": bool,
               "blurBackdrop": bool, "vignette": bool, "animatedGradient": bool,
               "glassmorphism": bool },
  "page": { "backgroundColor": hex, "backgroundGradientFrom": hex, "backgroundGradientTo": hex,
            "useGradientBg": bool, "headline": string, "subhead": string, "body": string,
            "ctaLabel": string, "ctaBg": hex, "ctaText": hex, "accentColor": hex,
            "effectPreset": "none|glow|shimmer|glass|neon|burst|rays|soft",
            "layoutMode": "stack|freeform", "heroScale": 40-180,
            "unlockHeadline": string, "unlockBody": string, "unlockFooter": string,
            "unlockGlowColor": hex, "unlockPanelBorderColor": hex,
            "fansProofTitle": string, "fansProofBody": string, "followTitle": string,
            "footerLine": string,
            "ctaGradientFrom": css color, "ctaGradientTo": css color, "ctaGradientAngle": 0-360,
            "ctaRadius": 0-999, "ctaShowArrow": bool,
            "headlineGradientFrom": css color, "headlineGradientTo": css color,
            "showMenuButton": bool, "menuButtonColor": css color,
            "features": [ { "icon": "star|clock|gift|users|ticket|video|music|shop|bolt|heart|crown|flame|lock|calendar|trophy|camera|sparkle|check", "label": string } ],
            "featureBg": css color, "featureBorderColor": css color,
            "featureIconColor": css color, "featureTextColor": css color, "featureRadius": 0-999,
            "memberProof": { "count": string, "label": string, "extraLabel": string,
                             "bg": css color, "borderColor": css color,
                             "countColor": css color, "labelColor": css color, "radius": 0-999 },
            "stage": [ { "id": "logo|wordmark|tagline|hero|titleArt|subhead|headline|body|featureRow|cta|memberProof",
                         "x": 0-95, "y": 0-95, "w": 8-100, "z": 0-100, "scale": 40-220,
                         "hidden": bool, "glow": bool, "glowColor": css color, "glowIntensity": 0-100,
                         "fillFrom": css color, "fillTo": css color, "borderColor": css color } ],
            "extraButtons": [ { "label": string, "href": url, "style": "solid|outline|ghost",
                                "bg": css color, "text": css color, "borderColor": css color,
                                "radius": 0-999, "glow": bool, "glowColor": css color,
                                "fullWidth": bool } ] },
  "pages": { "<pageKey>": { ...same shape as "page"... } },
  "nav": { "tabs": [ { "id": string, "label": string,
                       "icon": "home|users|video|news|user|live|shop|ticket|gift|calendar|crown|star|heart|bolt|trophy|camera",
                       "pageKey": pageKey, "hidden": bool } ],
           "bg": css color, "borderColor": css color, "activeColor": css color,
           "inactiveColor": css color, "radius": 0-40, "showLabels": bool, "hidden": bool },
  "killGlow": true,          // removes EVERY glow/shadow/shimmer across all pages
  "clearButtons": true,      // removes the extra buttons on the target page
  "addButtons": [ { "label": string, "href": url, "style": "solid|outline|ghost",
                    "bg": css color, "text": css color, "borderColor": css color, "radius": 0-999,
                    "glow": bool, "glowColor": css color, "fullWidth": bool } ]
}
COLORS: every color field accepts ANY CSS color — hex, rgb()/rgba(), hsl(), oklch(), color-mix() —
you are NOT limited to preset templates. Invent exact palettes to match the request or reference image.
Page keys: landing, youreIn, home, social, videos, news, events, live, docAndGlo (shop),
foundation, bio, profile, settings — every one is fully editable.
NAVIGATION: "nav" is the fan app bottom tab bar. You may reorder, rename, re-icon, hide, add
(max 6) or restyle tabs, and point each tab at any page key.
"page" patches the page the athlete is editing; use "pages" to patch specific other pages.
Set "applyToAllPages": true when the request is about the whole app look so every page matches.
Stage items are draggable — you may reposition, resize (w + scale), hide or unglow them to fix layout.
DELETING / REMODELING: to delete or remove an element from the phone, patch that stage item with
"hidden": true (e.g. {"stage":[{"id":"tagline","hidden":true}]}). To bring one back set "hidden": false.
When the athlete asks to remodel, rebuild or clean up the layout, send a full "stage" array with new
x/y/w/scale values for every visible element so the composition looks intentional.
PREMIUM LAYOUT KIT: to match high-end mockups use the feature strip ("features" 2-4 icon chips +
stage item "featureRow"), the gradient CTA ("ctaGradientFrom"/"ctaGradientTo"/"ctaShowArrow"/"ctaRadius":999),
a gradient headline ("headlineGradientFrom"/"headlineGradientTo"), a corner hamburger ("showMenuButton")
and the social-proof row ("memberProof" + stage item "memberProof"). Make sure the stage items for
featureRow / memberProof are visible (hidden:false) with sensible x/y/w when you add that content.
LAYERS: every element is its own draggable layer. Background photos stay photos — never bake text into
them. Use "navBar" (page label + Inner Circle style badge + bell + avatar), "signature" (script mark)
and "cardGrid" (2x2 photo cards, each with its own image/title/subtitle/icon/linkPageKey) as separate
stage items alongside headline, wordmark, tagline, cta and memberProof.
ARTWORK: you can generate imagery yourself. Set "imagePrompt" to a rich art-direction prompt and
"imageTarget" to one of "backgroundImage" | "heroImage" | "titleImage" whenever new artwork, a
background photo, hero image or title art would make the look land. It is generated and placed
automatically — never ask the athlete to go generate it.
When the athlete asks for less/no glow, dimmer, cleaner or "get rid of the glow", set
"killGlow": true inside "patch" (and effects.glow false) instead of tweaking one field.
When they ask for buttons / links / "cool stuff", use "addButtons" with tasteful labels and
colors drawn from the palette, and pick contrasting text colors.
When they attach a mockup, reproduce it closely: same palette, same blocks, same order.
You may change many groups in one patch — go all-in and make it look designed, not default.

`;


function systemPrompt(context: unknown, config: unknown, pageKey: string) {
  return [
    "You are the design copilot inside PlayersOS, customizing an athlete's fan app front end.",
    "You translate plain-language requests into concrete design changes. You have FULL control of",
    "colors, gradients, fonts, effects, copy, layout positions, buttons and per-page styling — use it.",
    "Be bold and tasteful:",
    "high contrast, readable text, cohesive palettes, dark-first premium sports aesthetics.",
    "Always keep text readable against its background and keep the athlete's brand identity intact",
    "unless they explicitly ask to change it.",
    "If a reference image is attached, pull its palette and mood into the patch.",
    "Reply with JSON ONLY, no markdown fences, shaped exactly:",
    "Never refuse a styling request and never ask for permission — make the strongest tasteful call,",
    "and change several groups at once so the result looks like a designed app, not a tweak.",
    "Reply with JSON ONLY, no markdown fences, shaped exactly:",
    '{"reply":"one or two short sentences on what you changed","patch":{...},"applyToAllPages":false,"imagePrompt":null,"imageTarget":"backgroundImage"}',
    SCHEMA_DOC,
    `ATHLETE CONTEXT: ${JSON.stringify(context)}`,
    `PAGE BEING EDITED: ${pageKey}`,
    `CURRENT CONFIG: ${JSON.stringify(config)}`,
  ].join("\n");
}

async function callGateway(key: string, body: unknown) {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

/** Best-effort JSON recovery: models sometimes truncate or trail commas. */
function extractJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  if (start < 0) throw new Error("AI returned an unexpected response");
  const body = cleaned.slice(start);

  const candidates: string[] = [];
  const end = body.lastIndexOf("}");
  if (end > 0) candidates.push(body.slice(0, end + 1));
  candidates.push(repairJson(body));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch { /* try next */ }
  }
  throw new Error("AI returned an unexpected response");
}

/** Close unterminated strings/braces from a truncated JSON stream. */
function repairJson(input: string) {
  let out = "";
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const ch of input) {
    out += ch;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  if (inString) out += '"';
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ": null");
  while (stack.length) out += stack.pop();
  return out;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "AI is not configured yet" }, 500);

  try {
    const body = (await req.json().catch(() => null)) as
      | {
          action?: string;
          instruction?: string;
          prompt?: string;
          pageKey?: string;
          image?: string;
          config?: unknown;
          context?: unknown;
          history?: { role: string; content: string }[];
        }
      | null;
    if (!body) return json({ error: "Invalid request" }, 400);

    if (body.action === "image") {
      const prompt = (body.prompt ?? "").trim().slice(0, 800);
      if (!prompt) return json({ error: "Describe the artwork first" }, 400);
      const data = await callGateway(key, {
        model: IMAGE_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}. Premium sports-brand art direction, dark cinematic background, no text, no watermark, mobile app friendly composition.`,
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      });
      const message = data?.choices?.[0]?.message ?? {};
      const url =
        message?.images?.[0]?.image_url?.url ??
        message?.images?.[0]?.url ??
        null;
      if (!url) return json({ error: "The model did not return an image — try again" }, 502);
      return json({ imageSrc: url });
    }

    const instruction = (body.instruction ?? "").trim().slice(0, 2000);
    const hasImage = typeof body.image === "string" && body.image.startsWith("data:image");
    if (!instruction && !hasImage) return json({ error: "Tell the designer what you want" }, 400);

    const pageKey = String(body.pageKey || "landing");
    const history = (body.history ?? [])
      .slice(-8)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) }));

    const content: ContentBlock[] = [
      {
        type: "text",
        text: instruction || "Use this reference image to restyle the app.",
      },
    ];
    if (hasImage) content.push({ type: "image_url", image_url: { url: body.image as string } });

    const data = await callGateway(key, {
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt(body.context ?? {}, body.config ?? {}, pageKey) },
        ...history,
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const raw = String(data?.choices?.[0]?.message?.content ?? "");
    const parsed = extractJson(raw) as {
      reply?: string;
      patch?: Record<string, unknown>;
      applyToAllPages?: boolean;
      imagePrompt?: string | null;
      imageTarget?: string | null;
    };

    const target =
      parsed.imageTarget === "heroImage" || parsed.imageTarget === "titleImage"
        ? parsed.imageTarget
        : "backgroundImage";

    return json({
      reply: parsed.reply || "Updated your look.",
      patch: parsed.patch ?? {},
      applyToAllPages: Boolean(parsed.applyToAllPages),
      imagePrompt: parsed.imagePrompt || null,
      imageTarget: target,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    const status = /429|rate/i.test(message) ? 429 : /402|credit/i.test(message) ? 402 : 500;
    return json({ error: message }, status);
  }
});
