import { Link } from "@/lib/router-compat";
import {
  ArrowRight,
  BarChart2,
  Bell,
  Brain,
  Layers,
  Link2,
  LogIn,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";

/**
 * Marketing landing page for the multi-athlete platform. Nothing here is tied
 * to a single athlete — copy speaks to any pro across any sport.
 */

const sports = [
  "Tennis",
  "Basketball",
  "Football",
  "Soccer",
  "Track & Field",
  "Golf",
  "Boxing",
  "Gymnastics",
  "Baseball",
  "Volleyball",
];

const pillars = [
  {
    icon: Smartphone,
    title: "Your own fan app",
    body: "Pick a template, drop in your colors and content, and publish a fan experience that looks built for you — not a generic link page.",
  },
  {
    icon: Brain,
    title: "AI that reads your data",
    body: "Insights and a private assistant that reason over your real platform, follower and post performance data — then tell you what to do this week.",
  },
  {
    icon: Link2,
    title: "One link that converts",
    body: "Claim your handle, funnel every bio, story and post into your app, and watch the taps land in your dashboard.",
  },
  {
    icon: BarChart2,
    title: "Every platform, one view",
    body: "Instagram, YouTube, TikTok, X and Facebook analytics side by side — with follower history you actually own.",
  },
  {
    icon: Users,
    title: "Know your fanbase",
    body: "Geo heatmaps, subscriber lists, segments and activity feeds so you can see who shows up and where they are.",
  },
  {
    icon: Bell,
    title: "Reach them on cue",
    body: "Draft push and toast moments from AI suggestions and milestone triggers, then send when the moment is live.",
  },
];

const steps = [
  {
    step: "01",
    title: "Claim your profile",
    body: "Tell us your name and sport. If you're already on the platform, we recognize you and hand back your dashboard.",
  },
  {
    step: "02",
    title: "Connect your platforms",
    body: "Link your socials once. Followers, posts and performance flow in and keep syncing.",
  },
  {
    step: "03",
    title: "Publish and grow",
    body: "Ship your fan app, share your link, and let AI insights guide the next drop.",
  },
];

function PageBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black via-[#120202] to-black" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(226,35,26,0.24),transparent_52%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_85%_18%,rgba(226,35,26,0.1),transparent_45%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),transparent_55%)]" />
    </>
  );
}

export function MarketingLandingPage() {
  return (
    <div className="marketing-theme relative min-h-[100dvh] overflow-x-hidden bg-black text-white">
      <PageBackground />

      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/welcome" className="shrink-0">
            <img
              src="/players-os-logo.png"
              alt="Players OS"
              className="h-14 w-auto max-w-[280px] object-contain sm:h-16"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login?mode=signup"
              className="hidden items-center gap-2 rounded-lg border border-dt-red/40 bg-dt-red/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-dt-red/60 hover:bg-dt-red/20 sm:inline-flex"
            >
              Create my platform
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              <LogIn size={16} />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-dt-red/40 bg-dt-red/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              <Sparkles size={14} />
              One platform · Every sport
            </div>
            <img
              src="/players-os-logo.png"
              alt="Players OS"
              className="mx-auto mb-8 h-28 w-auto max-w-[520px] object-contain sm:h-36 lg:h-44"
            />
            <h1 className="font-display text-4xl font-bold leading-tight tracking-wide text-white sm:text-5xl lg:text-6xl">
              Every athlete deserves{" "}
              <span className="text-dt-red">their own platform.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Players OS gives pros in any sport a branded fan app, unified analytics across every
              social platform, an AI strategist that reads their own numbers, and one link that turns
              followers into a fanbase they own.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login?mode=signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dt-red px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-dt-red/30 transition hover:bg-dt-red-hover sm:w-auto"
              >
                Create my platform
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5 sm:w-auto"
              >
                Sign in to my dashboard
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {sports.map((sport) => (
                <li
                  key={sport}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/60"
                >
                  {sport}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#120000]/90 via-black to-black p-1 shadow-2xl shadow-dt-red/10">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/80 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-dt-red/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-white/40">
                Your dashboard
              </span>
            </div>
            <div className="grid gap-px bg-white/5 p-4 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/60 p-4 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-dt-red">
                  Follower growth
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-white">All platforms</p>
                <p className="mt-1 text-xs text-white/50">
                  Daily snapshots you keep, even when a platform changes its API
                </p>
                <div className="mt-4 flex h-16 items-end gap-1">
                  {[40, 55, 48, 70, 62, 85, 78, 92].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-dt-red to-dt-red/40"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-black/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">
                    AI insight
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Reels outperform photos 3:1 — post two this week.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">
                    Bio link taps
                  </p>
                  <p className="mt-1 text-xl font-bold text-dt-red">Trending up</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-black/50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-dt-red">
                The platform
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
                Built for the business of being a pro
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                Six tools that used to take six vendors — now in one place, tuned to your sport and
                your brand.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 p-6 transition hover:border-dt-red/30 hover:from-dt-red/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-dt-red/30 bg-dt-red/10 p-2.5 text-dt-red">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-dt-red">
              Getting started
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
              Live in an afternoon
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 p-6"
              >
                <p className="font-display text-3xl font-bold text-dt-red/70">{step}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a0000]/80 via-black to-black p-8 sm:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-dt-red">
                  Why Players OS
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
                  You own the audience, not the algorithm
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                  Platforms rent you attention. Players OS turns that attention into a fanbase with
                  your name on it — profiles, subscribers, and history that stay yours across every
                  season and every team change.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <Layers size={16} className="mt-0.5 shrink-0 text-dt-red" />
                    Your own themeable fan app, published from a template gallery
                  </li>
                  <li className="flex items-start gap-2">
                    <Brain size={16} className="mt-0.5 shrink-0 text-dt-red" />
                    Private AI strategist trained on your numbers, not averages
                  </li>
                  <li className="flex items-start gap-2">
                    <Users size={16} className="mt-0.5 shrink-0 text-dt-red" />
                    Fan profiles, geo heatmaps and subscribers you can export
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-dt-red/20 bg-black/60 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-dt-red">
                  Athletes &amp; representation
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Join as an athlete, or request access for the athlete you represent.
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Agents and team staff get the same dashboard, scoped to their roster and verified
                  before entry.
                </p>
                <Link
                  to="/login?mode=signup"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-dt-red py-3 text-sm font-semibold text-white shadow-lg shadow-dt-red/25 transition hover:bg-dt-red-hover"
                >
                  Request access
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-black/70 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
              Ready to run your own platform?
            </h2>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Set up your profile, connect your platforms, and publish your fan app today.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link
                to="/login?mode=signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-dt-red px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-dt-red/30 transition hover:bg-dt-red-hover"
              >
                Create my platform
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:text-white"
              >
                <LogIn size={16} />
                Sign In
              </Link>
            </div>
            <p className="mt-8 text-sm font-semibold text-white/80">
              Verified athletes and their teams only.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-4 py-6 text-center text-[11px] font-bold uppercase tracking-widest text-white/50 sm:px-6">
        <p>Secure · Private · Compliant · Owned by athletes</p>
      </footer>
    </div>
  );
}
