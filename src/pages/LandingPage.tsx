import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  Send,
  Shield,
  Trophy,
  User,
  UserPlus,
} from "lucide-react";
import {
  isDashboardAuthed,
  saveDashboardSession,
  type DashboardRole,
} from "../lib/dashboardAuth";

const rosterAthletes = [
  { id: "athlete", name: "Your Athlete Profile", team: "", league: "" },
  { id: "sabrina", name: "Sabrina Ionescu", team: "New York Liberty", league: "WNBA" },
  { id: "lamar", name: "Lamar Jackson", team: "Baltimore Ravens", league: "NFL" },
  { id: "aaron", name: "A'ja Wilson", team: "Las Vegas Aces", league: "WNBA" },
];

type SignupRole = "agent" | "representative";

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"signin" | "signup" | "signup-sent">("signin");
  const [role, setRole] = useState<DashboardRole>("athlete");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedAthleteId, setSelectedAthleteId] = useState(rosterAthletes[0].id);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("agent");

  const selectedAthlete = rosterAthletes.find((a) => a.id === selectedAthleteId) ?? rosterAthletes[0];

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setView("signup");
    else if (mode === "signin") setView("signin");
  }, [searchParams]);

  function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    saveDashboardSession({
      name: name.trim() || (role === "admin" ? "PlayersOS Admin" : "Athlete"),
      email: email.trim(),
      role,
    });
    navigate("/", { replace: true });
  }

  function handleSignupRequest(e: FormEvent) {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim()) return;
    // Mock verification for now — nothing is emailed. Auto-approve so you can enter.
    saveDashboardSession({
      name: signupName.trim(),
      email: signupEmail.trim(),
      role: "admin",
    });
    setView("signup-sent");
  }

  function enterDashboard() {
    if (!isDashboardAuthed()) {
      saveDashboardSession({
        name: signupName.trim() || "PlayersOS Admin",
        email: signupEmail.trim(),
        role: "admin",
      });
    }
    navigate("/", { replace: true });
  }

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white focus:border-dt-red/60 focus:ring-1 focus:ring-dt-red/40";

  const fieldIconClass =
    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dt-red";

  const fieldLabelClass = "mb-1.5 block text-xs font-medium text-white";

  return (
    <div className="marketing-theme relative flex min-h-[100dvh] flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-[#150202] to-[#0a0101]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-[#1c0303] to-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.98),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(226,35,26,0.3),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(226,35,26,0.18),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.88),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.45),transparent_70%)]" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 w-full max-w-md text-center">
          <Link
            to="/welcome"
            className="mb-6 inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={13} />
            Back to Players OS home
          </Link>
          <img
            src="/players-os-logo.png"
            alt="Players OS"
            className="mx-auto h-24 w-auto max-w-[400px] object-contain sm:h-28"
          />
        </div>

        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-black/80 via-[#120202]/90 to-black/90 shadow-2xl shadow-black/80 backdrop-blur-md">
          {view === "signin" && (
            <>
              <div className="relative overflow-hidden border-b border-white/10 px-6 py-4">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-[#120202] to-black" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-dt-red/35 via-dt-red/10 to-black" />
                <div className="relative">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-dt-red">Members only</p>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-white">Sign In</h1>
                  <p className="mt-1 text-xs text-white/55">Any email + password works for now (mock login).</p>
                </div>
              </div>

              <form className="space-y-4 p-6" onSubmit={handleSignIn}>
                <div>
                  <p className="mb-2 text-xs font-medium text-white">Signing in as</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "athlete" as const, label: "Athlete", icon: Trophy },
                        { id: "admin" as const, label: "Admin", icon: Shield },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRole(id)}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          role === id
                            ? "border-dt-red bg-dt-red/20 text-white"
                            : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm">
                  <span className={fieldLabelClass}>Name</span>
                  <div className="relative">
                    <User size={15} className={fieldIconClass} />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder={role === "admin" ? "Admin name" : "Athlete name"}
                    />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className={fieldLabelClass}>Email</span>
                  <div className="relative">
                    <Mail size={15} className={fieldIconClass} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="you@team.com"
                      required
                    />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className={fieldLabelClass}>Password</span>
                  <div className="relative">
                    <Lock size={15} className={fieldIconClass} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-dt-red py-3 text-sm font-semibold text-white shadow-lg shadow-dt-red/30 transition hover:bg-dt-red-hover"
                >
                  <LogIn size={16} />
                  Enter PlayersOS Dashboard
                </button>

                <p className="text-center text-sm text-white">
                  Not a member?{" "}
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="font-semibold text-dt-red hover:text-dt-red-hover hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </>
          )}

          {view === "signup" && (
            <>
              <div className="relative overflow-hidden border-b border-white/10 px-6 py-4">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-[#120202] to-black" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-dt-red/35 via-dt-red/10 to-black" />
                <div className="relative">
                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="mb-2 flex items-center gap-1 text-xs text-white/50 hover:text-white"
                >
                  <ArrowLeft size={13} />
                  Back to sign in
                </button>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dt-red">Request access</p>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-wide text-white">Sign up</h1>
                <p className="mt-1 text-xs text-white/60">
                  Mock verification for now — you&apos;ll be auto-approved and can enter right away.
                </p>
                </div>
              </div>

              <form className="space-y-4 p-6" onSubmit={handleSignupRequest}>
                <div>
                  <p className="mb-2 text-xs font-medium text-white/60">Select athlete</p>
                  <div className="space-y-2">
                    {rosterAthletes.map((athlete) => {
                      const active = athlete.id === selectedAthleteId;
                      return (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() => setSelectedAthleteId(athlete.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                            active
                              ? "border-dt-red bg-dt-red/15"
                              : "border-white/15 bg-black/30 hover:border-white/25"
                          }`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dt-red/20 text-xs font-bold text-dt-red">
                            {athlete.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{athlete.name}</p>
                            <p className="text-[11px] text-white/50">
                              {athlete.team} · {athlete.league}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-white/60">Your role</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "agent" as const, label: "Agent" },
                        { id: "representative" as const, label: "Representative" },
                      ] as const
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSignupRole(id)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          signupRole === id
                            ? "border-dt-red bg-dt-red/20 text-white"
                            : "border-white/15 text-white/70 hover:border-white/30"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-white/60">Your name</span>
                  <div className="relative">
                    <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className={inputClass}
                      placeholder="Full name"
                      required
                    />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-white/60">Email</span>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={inputClass}
                      placeholder="you@agency.com"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-dt-red py-3 text-sm font-semibold text-white shadow-lg shadow-dt-red/30 transition hover:bg-dt-red-hover"
                >
                  <Send size={16} />
                  Continue with mock verification
                </button>
              </form>
            </>
          )}

          {view === "signup-sent" && (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dt-red/15 text-dt-red">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">Verified (mock)</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Nothing was emailed — verification is mocked for now. You&apos;re approved for{" "}
                <span className="text-white">{selectedAthlete.name}</span>&apos;s PlayersOS dashboard.
              </p>
              <button
                type="button"
                onClick={enterDashboard}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-dt-red py-3 text-sm font-semibold text-white shadow-lg shadow-dt-red/30 transition hover:bg-dt-red-hover"
              >
                <LogIn size={16} />
                Enter dashboard
              </button>
              <button
                type="button"
                onClick={() => setView("signin")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                <UserPlus size={15} />
                Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 max-w-sm text-center text-sm font-semibold text-white sm:text-base">
          Mock access for building PlayersOS — real athlete approval comes later.
        </p>
      </div>
    </div>
  );
}
