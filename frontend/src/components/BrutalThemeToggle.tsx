/**
 * BrutalThemeToggle - Switch between NeoBrutalism themes
 *
 * THEMES:
 * - neobrutal (light) - White background with bold colors
 * - neobrutaldark (dark) - Black background with bold colors
 */

import { useEffect, useState } from "react";

export function BrutalThemeToggle() {
  const [theme, setTheme] = useState<"neobrutal" | "neobrutaldark">("neobrutal");

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("brutal-theme") as "neobrutal" | "neobrutaldark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "neobrutal");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "neobrutal" ? "neobrutaldark" : "neobrutal";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("brutal-theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 px-6 py-3 bg-brutal-yellow text-black font-brutal font-bold text-sm uppercase brutal-btn hover:bg-brutal-orange"
      aria-label="Toggle theme"
    >
      {theme === "neobrutal" ? "🌙 DARK" : "☀️ LIGHT"}
    </button>
  );
}
