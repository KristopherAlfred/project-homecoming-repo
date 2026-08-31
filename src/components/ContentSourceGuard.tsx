import { useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import {
  CONTENT_ALLOWED_SOURCES,
  isContentRoute,
  useDashboardSource,
} from "../contexts/DashboardSourceContext";

/** On Content routes, snap social filters back to Overview and pulse the filter control. */
export function ContentSourceGuard() {
  const { pathname } = useLocation();
  const { source, setSource, pulseFilterButton } = useDashboardSource();

  useEffect(() => {
    if (!isContentRoute(pathname)) return;
    if (CONTENT_ALLOWED_SOURCES.includes(source)) return;
    setSource("overview");
    pulseFilterButton();
  }, [pathname, source, setSource, pulseFilterButton]);

  return null;
}
