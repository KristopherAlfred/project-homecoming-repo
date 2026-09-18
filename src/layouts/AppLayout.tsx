import { useEffect, useState } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { fillRouteCopy, routeMeta } from "../config/navigation";
import { DashboardSourceProvider } from "../contexts/DashboardSourceContext";
import { DametimeAnalyticsProvider } from "../contexts/DametimeAnalyticsContext";
import { InstagramAnalyticsProvider } from "../contexts/InstagramAnalyticsContext";
import { YouTubeAnalyticsProvider } from "../contexts/YouTubeAnalyticsContext";
import { FacebookAnalyticsProvider } from "../contexts/FacebookAnalyticsContext";
import { TwitterAnalyticsProvider } from "../contexts/TwitterAnalyticsContext";
import { SourceBanner } from "../components/dametime/DametimeAnalyticsStates";
import { ContentSourceGuard } from "../components/ContentSourceGuard";
import { OnboardingProvider } from "../components/onboarding/OnboardingTour";
import { useAthlete } from "../contexts/AthleteContext";
import { AiAssistantWidget } from "../components/AiAssistantWidget";

export function AppLayout() {
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { fanAppName, displayName } = useAthlete();
  const rawMeta = routeMeta[pathname] ?? {
    title: "{fanApp}",
    subtitle: "Creator analytics and fan engagement platform.",
  };
  const copyValues = { fanApp: fanAppName, athlete: displayName };
  const meta = {
    title: fillRouteCopy(rawMeta.title, copyValues),
    subtitle: fillRouteCopy(rawMeta.subtitle, copyValues),
  };

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <DashboardSourceProvider>
      <OnboardingProvider>
      <DametimeAnalyticsProvider>
        <InstagramAnalyticsProvider>
          <YouTubeAnalyticsProvider>
            <FacebookAnalyticsProvider>
            <TwitterAnalyticsProvider>
            <ContentSourceGuard />
            <div className="flex h-[100dvh] overflow-hidden bg-dt-bg">
            <Sidebar
              mobileOpen={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
            />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <Header
                title={meta.title}
                subtitle={meta.subtitle}
                onMenuClick={() => setMobileNavOpen(true)}
              />
              <main className="dt-main-canvas relative flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
                <div className="relative z-[1] mx-auto w-full min-w-0 max-w-[1600px]">
                  <SourceBanner />
                  <Outlet />
                </div>
              </main>
            </div>
            <AiAssistantWidget />
          </div>
          </TwitterAnalyticsProvider>
          </FacebookAnalyticsProvider>
          </YouTubeAnalyticsProvider>
        </InstagramAnalyticsProvider>
      </DametimeAnalyticsProvider>
      </OnboardingProvider>
    </DashboardSourceProvider>
  );
}
