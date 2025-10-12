/**
 * Animated Background Component
 *
 * FEATURES:
 * - Animated gradient background
 * - Floating geometric shapes
 * - Particle effects
 * - Responsive to theme changes
 * - GPU-accelerated animations
 */

import { useTheme } from "../ThemeContext";

export function AnimatedBackground() {
  const { mode, colorTheme } = useTheme();

  // Theme-specific gradients
  const gradients = {
    light: {
      default: "from-blue-100 via-purple-100 to-pink-100",
      cyberpunk: "from-pink-200 via-purple-200 to-cyan-200",
      ocean: "from-blue-100 via-cyan-100 to-teal-100",
      sunset: "from-orange-100 via-pink-100 to-purple-100",
      forest: "from-green-100 via-emerald-100 to-teal-100",
      rose: "from-rose-100 via-pink-100 to-purple-100",
    },
    dark: {
      default: "from-gray-900 via-purple-900 to-violet-900",
      cyberpunk: "from-gray-900 via-purple-900 to-cyan-900",
      ocean: "from-gray-900 via-blue-900 to-teal-900",
      sunset: "from-gray-900 via-orange-900 to-pink-900",
      forest: "from-gray-900 via-green-900 to-emerald-900",
      rose: "from-gray-900 via-rose-900 to-purple-900",
    },
  };

  const currentGradient = gradients[mode][colorTheme];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentGradient} transition-colors duration-1000`}
      >
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-gradient-shift" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {/* Orb 1 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-float-slow" />

        {/* Orb 2 */}
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 dark:from-pink-500/10 dark:to-orange-500/10 rounded-full blur-3xl animate-float-slower" />

        {/* Orb 3 */}
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 dark:from-cyan-500/10 dark:to-teal-500/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Geometric Shapes */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              className="animate-pulse-slow"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-600 dark:text-gray-400"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating Dots */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 dark:bg-white/10 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),_transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05),_transparent_50%)]" />
    </div>
  );
}
