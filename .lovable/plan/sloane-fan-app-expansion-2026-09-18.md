# Sloane Fan App Expansion

## Goal
Turn the Sloane Stephens fan app into a complete, polished mobile experience: every tab works, the landing-page glass style continues throughout, dashboard camera broadcasts appear in the fan app, scheduled lives show countdowns and in-app alerts, and five new editable premium templates are added without removing existing templates.

## Build

### 1. Sloane visual system across every page
- Replace the generic static subpage treatment with a shared Sloane page shell using the landing page’s transparent smoky glass, silver-white controls, soft reflections, and fixed visual backdrop.
- Reduce the fog at the landing-page video-to-glass transition while retaining a seamless fade.
- Keep the current Sloane landing identity, Join button, wording, and silver theme.
- Add distinct Sloane imagery across Home, Social, Videos, News, Events, Live, Shop, Foundation, Bio, and Profile, using locally stored app assets rather than hotlinked images.
- Add restrained motion: page transitions, image parallax, live pulse, countdown changes, horizontal media rails, and press feedback, with reduced-motion support.

### 2. Working mobile navigation and pages
- Restyle the existing bottom tabs as an Instagram-inspired mobile tab bar while keeping the current labels and page destinations.
- Add touch swipe navigation between visible tabs, animated active indicators, safe-area spacing, and persistent tab positioning.
- Make page cards, embedded links, media rows, profile actions, shop links, foundation links, and CTAs perform their configured action instead of acting as decorative controls.
- Preserve all current routes and the existing landing → join → welcome → app flow.

### 3. Full page editing
- Extend the current visual editor from the landing page to every fan-app page.
- Let users click text, images, cards, and page backgrounds to edit them; upload/replace/reframe images; drag and resize supported blocks; reorder cards and sections; hide/restore elements; and edit links.
- Keep edits mobile-safe by using responsive layout frames rather than unrestricted positioning.
- Surface the transparent panel color and opacity controls clearly whenever the Sloane background or page surface is selected.
- Include all page edits in the existing Undo/Redo history and published app configuration.

### 4. Dashboard camera → fan app live experience
- Add the missing fan-side live viewer so the public Live tab can receive the dashboard camera and microphone stream.
- Scope signaling by live session to prevent streams or viewers from crossing between sessions.
- Show four reliable states in the app: offline, scheduled with a live countdown, connecting, and live now.
- Show an in-app alert/banner across the fan app when a live is scheduled or starts; tapping it opens the Live tab.
- Add viewer count, connection recovery, muted autoplay with an explicit sound control, and graceful fallbacks when camera streaming is unavailable.
- Keep the dashboard as the control point for schedule, start, and end; changes propagate to the fan app automatically.

### 5. Five new premium templates
Keep every current template and add five new fully editable options:
1. **Wallpaper Live** — based on the supplied lock-screen reference: full wallpaper, large media, glass Join control where “Proud Of You” appears, and stacked live-link notifications.
2. **Editorial Court** — asymmetric sports-magazine composition with large photography and compact glass rails.
3. **Gallery Glass** — full-screen photo gallery with floating navigation and minimal typography.
4. **Match Day** — live-first layout with countdown, event cards, and bold scoreboard-inspired hierarchy.
5. **Quiet Luxury** — restrained monochrome editorial layout with translucent image panels and fine silver detailing.

Each template will define its own landing composition and coordinated subpages, while sharing the same editor, live states, link behavior, accessibility, and phone-safe navigation.

## Technical details
- Add reusable fan-page, mobile tab bar, live viewer/countdown, in-app live alert, and editable content-block components.
- Extend the experience configuration with explicit layout variants and editable page-content fields instead of detecting Sloane by name.
- Reuse the current live scheduling API, add a session-scoped WebRTC viewer paired with the dashboard host, and update the host channel to the same session scope.
- Public live reads remain read-only; dashboard live mutations remain protected. No private control secret will be added to public fan code.
- Add template art/page-art/copy entries through the existing template registries so all templates remain compatible with publishing and preview.
- Verify the editor and published Sloane app at phone widths, test every tab/button, test scheduled countdown and live start/end transitions, and confirm the app still builds cleanly.

## Assumptions
- “In-app alerts” means visible alerts while the fan app is open; this does not add email, SMS, or browser push.
- Dashboard-camera streaming uses direct browser WebRTC. It is appropriate for an initial fan experience but not a large broadcast audience; large-scale streaming would later require a dedicated streaming provider.
- Sloane photos will be sourced from legitimate public/official editorial pages when reusable; if a source cannot be safely stored, the template will use existing licensed/project media rather than hotlinking it.
