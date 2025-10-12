/**
 * Tailwind CSS Configuration
 *
 * DESIGN SYSTEM: Configure Tailwind's utility classes
 * DAISYUI: Component library built on Tailwind
 *
 * CUSTOMIZATION:
 * - Theme: Colors, fonts, spacing
 * - Plugins: Add functionality (DaisyUI)
 * - Content: Paths to scan for class names
 */

import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  /**
   * CONTENT: Files to scan for Tailwind classes
   *
   * PURGING: Tailwind removes unused styles in production
   * PERFORMANCE: Results in much smaller CSS bundle
   *
   * IMPORTANT: Include all files that use Tailwind classes
   */
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  /**
   * THEME: Customize design tokens
   *
   * EXTENSION: Add to default theme vs override
   *
   * CURRENT: Using defaults + DaisyUI
   * FUTURE: Add custom colors, fonts, spacing, etc.
   */
  theme: {
    extend: {
      /**
       * CUSTOM ANIMATIONS
       *
       * USAGE: animate-fadeIn, animate-slideUp, etc.
       */
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },

  /**
   * PLUGINS: Extend Tailwind functionality
   *
   * DAISYUI: Component library for Tailwind
   * BENEFITS:
   * - Pre-built components (buttons, cards, forms)
   * - Consistent design system
   * - Theme support
   * - Accessibility built-in
   */
  plugins: [
    // DaisyUI plugin imported as ES module
    daisyui,
  ],

  /**
   * DAISYUI CONFIGURATION
   *
   * THEMES: Available color schemes
   * STYLED: Add component classes
   * BASE: Include base styles
   * UTILS: Include utility classes
   */
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
    ],
    styled: true,
    base: true,
    utils: true,
    logs: false, // Disable console logs
    rtl: false, // Right-to-left support
  },
};
