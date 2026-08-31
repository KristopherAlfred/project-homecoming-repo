/** No default headshot — athletes add their own during onboarding or in Profile. */
export const DEFAULT_AVATAR_URL = "";

const AVATAR_KEY = "dt-dashboard-avatar";
const RING_KEY = "dt-dashboard-avatar-ring";
const AVATAR_EVENT = "dt-avatar-changed";

export const DEFAULT_RING_COLOR = "var(--theme-accent)";

export const RING_COLORS: { id: string; label: string; value: string }[] = [
  { id: "accent", label: "Your accent", value: DEFAULT_RING_COLOR },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "gold", label: "Gold", value: "#f5b60d" },
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "blue", label: "Blue", value: "#3b82f6" },
  { id: "purple", label: "Purple", value: "#a855f7" },
  { id: "black", label: "Black", value: "#000000" },
];

export function getDashboardAvatarRing(): string {
  try {
    return localStorage.getItem(RING_KEY)?.trim() || DEFAULT_RING_COLOR;
  } catch {
    return DEFAULT_RING_COLOR;
  }
}

export function setDashboardAvatarRing(color: string) {
  try {
    const value = color.trim();
    if (!value || value === DEFAULT_RING_COLOR) {
      localStorage.removeItem(RING_KEY);
    } else {
      localStorage.setItem(RING_KEY, value);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(AVATAR_EVENT));
}

export function getDashboardAvatar(): string {
  try {
    return localStorage.getItem(AVATAR_KEY)?.trim() || DEFAULT_AVATAR_URL;
  } catch {
    return DEFAULT_AVATAR_URL;
  }
}

export function setDashboardAvatar(src: string) {
  try {
    const value = src.trim();
    if (!value || value === DEFAULT_AVATAR_URL) {
      localStorage.removeItem(AVATAR_KEY);
    } else {
      localStorage.setItem(AVATAR_KEY, value);
    }
  } catch {
    /* storage full or unavailable — header just won't persist */
  }
  window.dispatchEvent(new Event(AVATAR_EVENT));
}

export function resetDashboardAvatar() {
  setDashboardAvatar("");
}

export function isDefaultAvatar(src: string) {
  return !src.trim();
}

/** Subscribe to avatar changes (returns unsubscribe). */
export function onDashboardAvatarChange(listener: () => void): () => void {
  window.addEventListener(AVATAR_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(AVATAR_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
