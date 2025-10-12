/**
 * Theme Context - Dark/Light Mode Management
 *
 * FEATURES:
 * - Toggle between light and dark themes
 * - Persist theme preference in localStorage
 * - System theme detection
 * - Smooth transitions between themes
 * - Multiple color themes (cyberpunk, ocean, sunset, etc.)
 */

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
export type ColorTheme = "default" | "cyberpunk" | "ocean" | "sunset" | "forest" | "rose";

const daisyThemes: Record<ColorTheme, { light: string; dark: string }> = {
  default: { light: "light", dark: "dark" },
  cyberpunk: { light: "cyberpunk", dark: "synthwave" },
  ocean: { light: "aqua", dark: "forest" },
  sunset: { light: "pastel", dark: "halloween" },
  forest: { light: "garden", dark: "forest" },
  rose: { light: "valentine", dark: "dracula" },
};

interface ThemeContextType {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  toggleMode: () => void;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Component
 *
 * Manages theme state and provides it to all child components
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage first
    const saved = localStorage.getItem("theme-mode");
    if (saved === "light" || saved === "dark") return saved;

    // Fall back to system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem("color-theme");
    if (saved) return saved as ColorTheme;
    return "default";
  });

  // Update document classes, data attributes, and localStorage when theme changes
  useEffect(() => {
    const root = document.documentElement;

    // Toggle dark/light helpers for custom styles
    root.classList.remove("light", "dark");
    root.classList.add(mode);

    // Apply DaisyUI theme mapping
    const activeTheme = daisyThemes[colorTheme]?.[mode] || daisyThemes.default[mode];
    root.setAttribute("data-theme", activeTheme);
    root.setAttribute("data-color-theme", colorTheme);

    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("color-theme", colorTheme);
  }, [mode, colorTheme]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, toggleMode, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
