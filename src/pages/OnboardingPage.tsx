import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Link2,
  Loader2,
  Layers,
  MapPin,
  Palette,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import {
  claimBioSlug,
  findAthleteByName,
  isSlugAvailable,
  saveAthleteTheme,
  slugify,
  upsertAthlete,
  type Athlete,
} from "../lib/athletes";
import { loadDashboardSession } from "../lib/dashboardAuth";
import { SportPicker, type SportSelection } from "../components/sports/SportPicker";
import {
  LeaguePicker,
  LevelPicker,
  RolePicker,
  TeamPicker,
} from "../components/sports/OnboardingPickers";
import { DashboardPreview } from "../components/onboarding/DashboardPreview";
import { findLeague, findSport, type League } from "../lib/sportsCatalog";
import { findLevel } from "../lib/sportsTeams";
import { useAthlete } from "../contexts/AthleteContext";
import { setDashboardAvatar } from "../lib/adminProfile";

/**
 * Multi-step athlete onboarding, one decision per page: name → sport → brand →
 * level → league → team → role → dashboard preview → bio link. Step 1
 * name-matches against existing athletes so a migrated athlete (Sloane is #1)
 * is recognised and skips straight in.
 */

const ACCENTS = [
  { label: "Mint", accent: "#7CE7B0", text: "#04231A" },
  { label: "Crimson", accent: "#E2231A", text: "#FFFFFF" },
  { label: "Electric", accent: "#4C8DFF", text: "#05122B" },
  { label: "Gold", accent: "#F5C451", text: "#241A02" },
  { label: "Violet", accent: "#B482FF", text: "#1A0B2E" },
  { label: "Coral", accent: "#FF7A59", text: "#2B0C03" },
];

const STEP_LABELS = [
  "You",
  "Sport",
  "Brand",
  "Level",
  "League",
  "Team",
  "Role",
  "Preview",
  "Link",
];

/** Steps that need the wide card. */
const WIDE_STEPS = new Set([1, 3, 4, 5, 7]);

const cardClass =
  "w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-black/80 via-[#120202]/90 to-black/90 shadow-2xl shadow-black/80 backdrop-blur-md";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-dt-red/60 focus:ring-1 focus:ring-dt-red/40";

const labelClass = "mb-1.5 block text-xs font-medium text-white/80";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { athlete, refresh } = useAthlete();
  const session = loadDashboardSession();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(session?.name?.trim() ?? "");
  const [displayName, setDisplayName] = useState("");
  const [sport, setSport] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [fanAppName, setFanAppName] = useState("");
  const [accentIndex, setAccentIndex] = useState(0);
  const [sportId, setSportId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [leagueLabel, setLeagueLabel] = useState("");
  const [leagueAccent, setLeagueAccent] = useState<{ accent: string; text: string } | null>(null);
  const [teamLabel, setTeamLabel] = useState("");
  const [role, setRole] = useState("");
  const [headshot, setHeadshot] = useState("");
  const [slug, setSlug] = useState("");
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken">("idle");

  const [match, setMatch] = useState<Athlete | null>(null);
  const [checkingMatch, setCheckingMatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already onboarded → nothing to do here.
  useEffect(() => {
    if (athlete?.onboarding_completed) navigate("/", { replace: true });
  }, [athlete, navigate]);

  const firstName = useMemo(() => fullName.trim().split(/\s+/)[0] ?? "", [fullName]);
  const selectedSport = useMemo(() => findSport(sportId || sport), [sportId, sport]);
  const selectedLeague = useMemo(
    () => findLeague(selectedSport, leagueId || leagueLabel),
    [selectedSport, leagueId, leagueLabel],
  );

  const activeAccent = leagueAccent ?? ACCENTS[accentIndex];
  const resolvedFanAppName = fanAppName.trim() || `${firstName || "Your"} Fan App`;
  const resolvedDisplayName = displayName.trim() || fullName.trim();

  useEffect(() => {
    if (!slug && firstName) setSlug(slugify(fullName));
  }, [firstName, fullName, slug]);

  useEffect(() => {
    if (!fanAppName && firstName) setFanAppName(`${firstName} Fan App`);
  }, [firstName, fanAppName]);

  // Debounced slug availability check.
  useEffect(() => {
    const clean = slugify(slug);
    if (clean.length < 3) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const timer = setTimeout(async () => {
      const free = await isSlugAvailable(clean, athlete?.id);
      setSlugState(free ? "free" : "taken");
    }, 350);
    return () => clearTimeout(timer);
  }, [slug, athlete?.id]);

  async function handleNameNext() {
    setError(null);
    if (fullName.trim().length < 3) {
      setError("Please enter your full name.");
      return;
    }
    setCheckingMatch(true);
    try {
      const found = await findAthleteByName(fullName);
      if (found) {
        setMatch(found);
        return;
      }
      setStep(1);
    } finally {
      setCheckingMatch(false);
    }
  }

  async function claimExisting() {
    if (!match) return;
    setSaving(true);
    setError(null);
    try {
      await upsertAthlete({ full_name: match.full_name, onboarding_completed: true });
      await refresh();
      navigate("/", { replace: true });
    } catch {
      setError("Could not link that dashboard. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleLeagueChange(item: League | null, customLabel?: string) {
    if (item) {
      setLeagueId(item.id);
      setLeagueLabel(item.label);
      setLeagueAccent({ accent: item.accent, text: item.accentText });
      return;
    }
    if (customLabel) {
      setLeagueId("");
      setLeagueLabel(customLabel);
      setLeagueAccent(null);
    }
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const athleteId = await upsertAthlete({
        full_name: fullName.trim(),
        display_name: resolvedDisplayName,
        sport: sport || null,
        sport_icon: sportId || null,
        gender: gender || null,
        competition_level: findLevel(levelId)?.label ?? null,
        league: leagueLabel.trim() || null,
        position: role || null,
        team_or_league: teamLabel.trim() || leagueLabel.trim() || null,
        bio_short: bio.trim() || null,
        profile_photo_url: /^https?:\/\//i.test(headshot) ? headshot : null,
        onboarding_completed: true,
      });

      await saveAthleteTheme(athleteId, {
        accent_color: activeAccent.accent,
        accent_hover: activeAccent.accent,
        button_bg: activeAccent.accent,
        button_text: activeAccent.text,
        fan_app_name: resolvedFanAppName,
      });

      if (headshot) setDashboardAvatar(headshot);

      const clean = slugify(slug);
      if (clean.length >= 3 && slugState !== "taken") {
        await claimBioSlug(athleteId, clean, { destination_app_url: "/experience" });
      }

      await refresh();
      navigate("/", { replace: true });
    } catch {
      setError("Something went wrong saving your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="marketing-theme relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-black px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-[#150202] to-[#0a0101]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(226,35,26,0.22),transparent_58%)]" />

      <div className="relative z-10 mb-6 text-center">
        <img
          src="/players-os-logo.png"
          alt="Players OS"
          className="mx-auto h-16 w-auto max-w-[260px] object-contain"
        />
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/45">
          Athlete onboarding
        </p>
      </div>

      <div className={`relative z-10 ${cardClass} ${WIDE_STEPS.has(step) ? "max-w-6xl" : "max-w-xl"}`}>
        <div className="flex items-center gap-1.5 border-b border-white/10 px-6 py-3">
          {STEP_LABELS.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-1.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  index < step
                    ? "bg-dt-red text-white"
                    : index === step
                      ? "border border-dt-red/70 text-dt-red"
                      : "border border-white/15 text-white/40"
                }`}
              >
                {index < step ? <Check size={12} /> : index + 1}
              </span>
              <span
                className={`hidden text-[11px] lg:block ${
                  index === step ? "text-white" : "text-white/40"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-5 p-6">
          {/* ---- Step 1: name + existing-athlete match ---- */}
          {step === 0 && !match && (
            <>
              <Heading
                icon={UserRound}
                title="What's your name?"
                subtitle="We'll check if a Players OS dashboard already exists for you."
              />
              <div>
                <label className={labelClass} htmlFor="onboarding-name">
                  Full name
                </label>
                <input
                  id="onboarding-name"
                  className={inputClass}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. your full name"
                  autoFocus
                />
              </div>
              <PrimaryButton onClick={handleNameNext} loading={checkingMatch}>
                Continue
              </PrimaryButton>
            </>
          )}

          {/* ---- Step 1b: matched an existing athlete ---- */}
          {step === 0 && match && (
            <>
              <Heading
                icon={Sparkles}
                title={`Welcome back, ${match.display_name || match.full_name}`}
                subtitle="We already have a dashboard with your analytics, content and fans."
              />
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                {match.profile_photo_url ? (
                  <img
                    src={match.profile_photo_url}
                    alt={match.full_name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-dt-red/20 text-sm font-semibold text-dt-red">
                    {match.full_name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{match.full_name}</p>
                  <p className="truncate text-xs text-white/50">
                    {[match.sport, match.team_or_league].filter(Boolean).join(" · ") ||
                      "Players OS athlete"}
                  </p>
                </div>
              </div>
              <PrimaryButton onClick={claimExisting} loading={saving}>
                Yes, that's me — open my dashboard
              </PrimaryButton>
              <button
                type="button"
                className="w-full text-xs text-white/50 transition hover:text-white"
                onClick={() => {
                  setMatch(null);
                  setStep(1);
                }}
              >
                Not me — set up a new profile
              </button>
            </>
          )}

          {/* ---- Step 2: visual sport picker ---- */}
          {step === 1 && (
            <>
              <Heading
                icon={Trophy}
                title="Pick your sport"
                subtitle="Your sport and league shape your dashboard colours, badge and metrics."
              />
              <SportPicker
                sportLabel={sport}
                leagueLabel={leagueLabel}
                division={gender}
                showLeagues={false}
                onDivisionChange={setGender}
                onChange={(selection: SportSelection) => {
                  setSportId(selection.sportId);
                  setSport(selection.sportLabel);
                  if (selection.sportId !== sportId) {
                    setLeagueId("");
                    setLeagueLabel("");
                    setTeamLabel("");
                    setRole("");
                    setLeagueAccent(null);
                  }
                }}
              />
              <div>
                <label className={labelClass} htmlFor="onboarding-bio">
                  Short bio
                </label>
                <textarea
                  id="onboarding-bio"
                  className={`${inputClass} min-h-[76px] resize-none`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 240))}
                  placeholder="One line fans will see on your app."
                />
              </div>
              <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}

          {/* ---- Step 3: brand ---- */}
          {step === 2 && (
            <>
              <Heading
                icon={Palette}
                title="Name and colour your fan app"
                subtitle="You can fine-tune everything later in the Experience tab."
              />
              <div>
                <label className={labelClass} htmlFor="onboarding-display">
                  Display name
                </label>
                <input
                  id="onboarding-display"
                  className={inputClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={fullName || "How fans see your name"}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="onboarding-fanapp">
                  Fan app name
                </label>
                <input
                  id="onboarding-fanapp"
                  className={inputClass}
                  value={fanAppName}
                  onChange={(e) => setFanAppName(e.target.value)}
                  placeholder={`${firstName || "Your"} Fan App`}
                />
              </div>
              <div>
                <span className={labelClass}>Profile headshot</span>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  {headshot ? (
                    <img
                      src={headshot}
                      alt="Your headshot"
                      className="h-14 w-14 rounded-full border border-white/20 object-cover object-top"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 bg-black/50 text-sm font-semibold text-white/50">
                      {(displayName || fullName).slice(0, 1).toUpperCase() || "?"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/85 transition hover:bg-white/[0.08]">
                      <Upload size={13} />
                      {headshot ? "Change photo" : "Upload headshot"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          if (!file.type.startsWith("image/")) {
                            setError("Pick an image file (PNG, JPG, WEBP…)");
                            return;
                          }
                          if (file.size > 2_500_000) {
                            setError("Image is too big — keep it under 2.5 MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setHeadshot(reader.result);
                              setError(null);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <p className="mt-1.5 text-[11px] text-white/40">
                      Shows in the top-right of your dashboard. Square photos look best.
                    </p>
                  </div>
                  {headshot ? (
                    <button
                      type="button"
                      onClick={() => setHeadshot("")}
                      className="text-[11px] text-white/45 transition hover:text-white"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <div>
                <span className={labelClass}>Accent colour</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {ACCENTS.map((option, index) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        setAccentIndex(index);
                        setLeagueAccent(null);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition ${
                        accentIndex === index && !leagueAccent
                          ? "border-white/70 bg-white/10"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: option.accent }}
                      />
                      <span className="text-[10px] text-white/60">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
            </>
          )}

          {/* ---- Step 4: competition level ---- */}
          {step === 3 && (
            <>
              <Heading
                icon={Layers}
                title="Find your team"
                subtitle="What level do you compete at? Choose the league and team that represent you."
              />
              <LevelPicker
                value={levelId}
                onChange={(id) => {
                  setLevelId(id);
                  setStep(4);
                }}
              />
              <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
            </>
          )}

          {/* ---- Step 5: league ---- */}
          {step === 4 && (
            <>
              <Heading
                icon={ShieldCheck}
                title="Select your league"
                subtitle={`${findLevel(levelId)?.label ?? "Your level"} · ${
                  selectedSport?.label ?? "your sport"
                } leagues and organizations.`}
              />
              <LeaguePicker
                sport={selectedSport}
                levelId={levelId}
                value={leagueLabel}
                onChange={handleLeagueChange}
              />
              <StepNav onBack={() => setStep(3)} onNext={() => setStep(5)} />
            </>
          )}

          {/* ---- Step 6: team ---- */}
          {step === 5 && (
            <>
              <Heading
                icon={Users}
                title="Select your team"
                subtitle={
                  leagueLabel
                    ? `Search ${leagueLabel} teams, schools or clubs.`
                    : "Search teams, schools or clubs."
                }
              />
              <TeamPicker
                sport={selectedSport}
                leagueId={leagueId}
                leagueLabel={leagueLabel}
                value={teamLabel}
                onChange={setTeamLabel}
              />
              <StepNav onBack={() => setStep(4)} onNext={() => setStep(6)} />
            </>
          )}

          {/* ---- Step 7: role ---- */}
          {step === 6 && (
            <>
              <Heading
                icon={MapPin}
                title="What's your role?"
                subtitle="Your position helps us customize your dashboard with the most relevant metrics and insights."
              />
              <RolePicker sportId={sportId} value={role} onChange={setRole} />
              <StepNav onBack={() => setStep(5)} onNext={() => setStep(7)} />
            </>
          )}

          {/* ---- Step 8: dashboard preview ---- */}
          {step === 7 && (
            <>
              <Heading
                icon={Sparkles}
                title="Does this look right?"
                subtitle="Here's your dashboard, built from everything you just picked."
              />
              <DashboardPreview
                accent={activeAccent.accent}
                accentText={activeAccent.text}
                displayName={resolvedDisplayName}
                fanAppName={resolvedFanAppName}
                headshot={headshot}
                sport={selectedSport}
                league={selectedLeague}
                leagueLabel={leagueLabel}
                teamLabel={teamLabel}
                role={role}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2.5 text-sm text-white/70 transition hover:text-white"
                >
                  <ArrowLeft size={14} />
                  Change something
                </button>
                <div className="flex-1">
                  <PrimaryButton onClick={() => setStep(8)}>Yes, looks right</PrimaryButton>
                </div>
              </div>
            </>
          )}

          {/* ---- Step 9: bio link ---- */}
          {step === 8 && (
            <>
              <Heading
                icon={Link2}
                title="Claim your bio link"
                subtitle="One link for every platform, funnelling fans into your app."
              />
              <div>
                <label className={labelClass} htmlFor="onboarding-slug">
                  Your link
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2.5">
                  <span className="text-xs text-white/40">playersos.app/go/</span>
                  <input
                    id="onboarding-slug"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="your-name"
                  />
                  {slugState === "checking" && (
                    <Loader2 size={14} className="animate-spin text-white/40" />
                  )}
                  {slugState === "free" && <Check size={14} className="text-emerald-400" />}
                </div>
                {slugState === "taken" && (
                  <p className="mt-1.5 text-xs text-dt-red">That link is already taken.</p>
                )}
                {slugState === "free" && (
                  <p className="mt-1.5 text-xs text-emerald-400">This link is available.</p>
                )}
              </div>
              <PrimaryButton onClick={finish} loading={saving}>
                Finish setup
              </PrimaryButton>
              <button
                type="button"
                className="w-full text-xs text-white/50 transition hover:text-white"
                onClick={() => setStep(7)}
              >
                Back
              </button>
            </>
          )}

          {error && <p className="text-xs text-dt-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function Heading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof UserRound;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dt-red/15 text-dt-red">
        <Icon size={17} />
      </span>
      <div>
        <h1 className="font-display text-xl font-bold text-white">{title}</h1>
        <p className="mt-0.5 text-xs text-white/55">{subtitle}</p>
      </div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-dt-red px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {children}
      {!loading ? <ArrowRight size={15} /> : null}
    </button>
  );
}

function StepNav({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2.5 text-sm text-white/70 transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Back
      </button>
      <div className="flex-1">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
