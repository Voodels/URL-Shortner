/**
 * PostCSS Configuration
 * 
 * POSTCSS: CSS transformation tool
 * PURPOSE: Process CSS with plugins
 * 
 * PLUGINS:
 * - Tailwind CSS: Utility-first CSS framework
 * - Autoprefixer: Add vendor prefixes automatically
 */

export default {
  plugins: {
    /**
     * TAILWIND CSS: Generate utility classes
     * 
     * PROCESSING: Scans files, generates CSS, purges unused
     */
    tailwindcss: {},

    /**
     * AUTOPREFIXER: Add vendor prefixes
     * 
     * CROSS-BROWSER: Automatically adds -webkit-, -moz-, etc.
     * BROWSERSLIST: Uses .browserslistrc or package.json config
     * 
     * EXAMPLE:
     * Input:  display: flex;
     * Output: display: -webkit-flex; display: flex;
     */
    autoprefixer: {},
  },
};
