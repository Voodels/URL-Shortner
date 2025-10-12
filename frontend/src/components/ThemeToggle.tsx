/**
 * Theme Toggle Component - Dark/Light Mode Switcher
 *
 * FEATURES:
 * - Animated toggle button
 * - Sun/Moon icons
 * - Smooth transitions
 * - Color theme selector in dropdown
 * - Hamburger menu to toggle visibility
 */

import { useState } from "react";
import { useAuth } from "../AuthContext";
import { ColorTheme, useTheme } from "../ThemeContext";

export function ThemeToggle() {
  const { mode, colorTheme, toggleMode, setColorTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const colorThemes: { name: string; value: ColorTheme; gradient: string }[] = [
    { name: "Default", value: "default", gradient: "from-blue-500 to-purple-600" },
    { name: "Cyberpunk", value: "cyberpunk", gradient: "from-pink-500 to-cyan-500" },
    { name: "Ocean", value: "ocean", gradient: "from-blue-400 to-teal-500" },
    { name: "Sunset", value: "sunset", gradient: "from-orange-500 to-pink-600" },
    { name: "Forest", value: "forest", gradient: "from-green-500 to-emerald-600" },
    { name: "Rose", value: "rose", gradient: "from-rose-400 to-purple-500" },
  ];

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-16 h-16 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Toggle theme menu"
      >
        {/* Hamburger Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-5 flex flex-col justify-between">
            <span
              className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-300 ${
                isOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-300 ${
                isOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Theme Menu - Only show when open */}
      {isOpen && (
        <div className="animate-fade-in-down flex flex-col gap-3 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-lg min-w-[220px]">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {mode === "light" ? "Light" : "Dark"} Mode
            </span>
            <button
              onClick={toggleMode}
              className="group relative w-12 h-12 rounded-full bg-white/20 dark:bg-black/30 border border-white/30 dark:border-white/20 hover:scale-110 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {/* Sun Icon */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  mode === "light"
                    ? "rotate-0 opacity-100 scale-100"
                    : "rotate-180 opacity-0 scale-0"
                }`}
              >
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>

              {/* Moon Icon */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  mode === "dark"
                    ? "rotate-0 opacity-100 scale-100"
                    : "-rotate-180 opacity-0 scale-0"
                }`}
              >
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 dark:bg-white/10" />

          {/* Color Theme Selector */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 px-1">
              Color Theme
            </div>
            <div className="grid grid-cols-3 gap-2">
              {colorThemes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setColorTheme(theme.value)}
                  className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} transition-all duration-300 ${
                    colorTheme === theme.value
                      ? "scale-110 ring-2 ring-white dark:ring-gray-200 ring-offset-2 ring-offset-transparent"
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  }`}
                  title={theme.name}
                  aria-label={`Select ${theme.name} theme`}
                  aria-pressed={colorTheme === theme.value}
                >
                  {colorTheme === theme.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white drop-shadow-lg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {isAuthenticated && (
            <>
              <div className="h-px bg-white/20 dark:bg-white/10" />
              <div className="flex flex-col gap-3">
                {user?.email && (
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 px-1 truncate">
                    Signed in as
                    <span className="block text-sm text-gray-800 dark:text-gray-100 font-semibold">
                      {user.email}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-error btn-sm normal-case"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
