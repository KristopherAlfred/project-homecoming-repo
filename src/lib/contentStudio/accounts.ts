import { useMemo } from "react";
import { useAthlete } from "../../contexts/AthleteContext";
import { useSocialSources, type SocialPlatformKey } from "../socialSources";
import {
  PLATFORMS,
  PLATFORM_ORDER,
  type ConnectionState,
  type StudioPlatformKey,
} from "./platforms";

/**
 * Connected-account resolution for the currently selected workspace.
 * Names, handles and avatars always come from the logged-in profile and its
 * own connectors — never from example data.
 */

export type StudioAccount = {
  platform: StudioPlatformKey;
  label: string;
  /** Handle shown in previews, e.g. "@teamhandle". */
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  followers: number | null;
  connection: ConnectionState;
  connected: boolean;
  lastSyncedAt: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function useStudioAccounts() {
  const { sources, loading, reload } = useSocialSources();
  const { athlete, displayName, fanAppName } = useAthlete();

  const accounts = useMemo<Record<StudioPlatformKey, StudioAccount>>(() => {
    const result = {} as Record<StudioPlatformKey, StudioAccount>;
    for (const key of PLATFORM_ORDER) {
      const def = PLATFORMS[key];
      if (key === "fanapp") {
        result[key] = {
          platform: key,
          label: def.label,
          handle: null,
          displayName: fanAppName,
          avatarUrl: athlete?.profile_photo_url ?? null,
          followers: null,
          connection: "connected",
          connected: true,
          lastSyncedAt: null,
        };
        continue;
      }
      const source = sources?.[def.connectorKey as SocialPlatformKey];
      const connected = Boolean(source?.connected);
      const handle = source?.handle ?? null;
      result[key] = {
        platform: key,
        label: def.label,
        handle,
        displayName: handle ?? displayName,
        avatarUrl: athlete?.profile_photo_url ?? null,
        followers: source?.followerCount ?? null,
        connection: connected ? (handle ? "connected" : "permission_required") : "disconnected",
        connected,
        lastSyncedAt: source?.lastSyncedAt ?? null,
      };
    }
    return result;
  }, [sources, athlete, displayName, fanAppName]);

  const connectedKeys = useMemo(
    () => PLATFORM_ORDER.filter((key) => accounts[key].connected),
    [accounts],
  );

  return { accounts, connectedKeys, loading, reload, initials };
}

export function accountInitials(name: string) {
  return initials(name);
}

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
