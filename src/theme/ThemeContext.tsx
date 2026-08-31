import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyPalette,
  getPalette,
  isThemeTemplate,
  setAccentOverrideEnabled,
  STORAGE_KEY,
  themeTemplates,
  type ThemePalette,
  type ThemeTemplate,
} from "./themes";

interface ThemeContextValue {
  template: ThemeTemplate;
  palette: ThemePalette;
  setTemplate: (template: ThemeTemplate) => void;
  templates: typeof themeTemplates;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MANUAL_KEY = `${STORAGE_KEY}.manual`;

function readManual(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MANUAL_KEY) === "1";
}

function readStoredTemplate(): ThemeTemplate {
  if (typeof window === "undefined") return "default";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isThemeTemplate(stored)) return stored;
  return "default";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [template, setTemplateState] = useState<ThemeTemplate>("default");
  const palette = useMemo(() => getPalette(template), [template]);

  useEffect(() => {
    // Hydrate the stored template on the client to avoid SSR mismatch.
    setTemplateState(readStoredTemplate());
  }, []);

  useEffect(() => {
    // A manually picked template owns the accent; otherwise the athlete's
    // onboarding / league accent keeps driving the front end.
    setAccentOverrideEnabled(!readManual());
    applyPalette(palette);
  }, [palette]);

  const setTemplate = useCallback((next: ThemeTemplate) => {
    setTemplateState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(MANUAL_KEY, "1");
    }
    setAccentOverrideEnabled(false);
  }, []);

  const value = useMemo(
    () => ({ template, palette, setTemplate, templates: themeTemplates }),
    [template, palette, setTemplate],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
