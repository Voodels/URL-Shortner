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
       * NEOBRUTAL COLORS
       * High-contrast, bold, uncompromising color palette
       */
      colors: {
        brutal: {
          black: '#000000',
          white: '#FFFFFF',
          yellow: '#FFEB3B',
          red: '#FF1744',
          orange: '#FF6F00',
          pink: '#FF00FF',
          blue: '#00B8D4',
          green: '#00E676',
          purple: '#D500F9',
        },
      },
      /**
       * BRUTAL TYPOGRAPHY
       * Heavy, industrial, monospace fonts
       */
      fontFamily: {
        brutal: ['Space Mono', 'Courier New', 'monospace'],
        display: ['Space Grotesk', 'Arial Black', 'sans-serif'],
      },
      /**
       * BRUTAL BORDERS
       * Thick, prominent borders
       */
      borderWidth: {
        brutal: '4px',
        'brutal-thick': '6px',
        'brutal-heavy': '8px',
      },
      /**
       * BRUTAL SHADOWS
       * Hard, offset shadows (no blur)
       */
      boxShadow: {
        brutal: '8px 8px 0px 0px #000000',
        'brutal-sm': '4px 4px 0px 0px #000000',
        'brutal-lg': '12px 12px 0px 0px #000000',
        'brutal-xl': '16px 16px 0px 0px #000000',
        'brutal-yellow': '8px 8px 0px 0px #FFEB3B',
        'brutal-red': '8px 8px 0px 0px #FF1744',
        'brutal-blue': '8px 8px 0px 0px #00B8D4',
      },
      /**
       * CUSTOM ANIMATIONS
       */
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'brutal-pop': 'brutalPop 0.2s cubic-bezier(.4,0,.2,1)',
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
        brutalPop: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(0.95) translate(4px, 4px)' },
          '100%': { transform: 'scale(1) translate(0, 0)' },
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
      {
        neobrutal: {
          "primary": "#FFEB3B",           // Electric Yellow
          "primary-content": "#000000",    // Black text on yellow
          "secondary": "#FF1744",          // Harsh Red
          "secondary-content": "#FFFFFF",  // White text on red
          "accent": "#00B8D4",             // Industrial Blue
          "accent-content": "#000000",     // Black text on blue
          "neutral": "#000000",            // Pure Black
          "neutral-content": "#FFFFFF",    // White text on black
          "base-100": "#FFFFFF",           // White background
          "base-200": "#F5F5F5",           // Light gray
          "base-300": "#E0E0E0",           // Medium gray
          "base-content": "#000000",       // Black text
          "info": "#00B8D4",               // Blue
          "success": "#00E676",            // Green
          "warning": "#FF6F00",            // Orange
          "error": "#FF1744",              // Red
        },
      },
      {
        neobrutaldark: {
          "primary": "#FFEB3B",           // Electric Yellow
          "primary-content": "#000000",    // Black text on yellow
          "secondary": "#FF1744",          // Harsh Red
          "secondary-content": "#FFFFFF",  // White text on red
          "accent": "#00B8D4",             // Industrial Blue
          "accent-content": "#000000",     // Black text on blue
          "neutral": "#FFFFFF",            // Pure White
          "neutral-content": "#000000",    // Black text on white
          "base-100": "#000000",           // Black background
          "base-200": "#1A1A1A",           // Dark gray
          "base-300": "#2D2D2D",           // Medium gray
          "base-content": "#FFFFFF",       // White text
          "info": "#00B8D4",               // Blue
          "success": "#00E676",            // Green
          "warning": "#FF6F00",            // Orange
          "error": "#FF1744",              // Red
        },
      },
      "light",
      "dark",
    ],
    styled: true,
    base: true,
    utils: true,
    logs: false,
    rtl: false,
  },
};
