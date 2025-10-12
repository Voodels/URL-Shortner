/**
 * Main Entry Point - Application Bootstrap
 *
 * RESPONSIBILITIES:
 * - Initialize React application
 * - Mount root component to DOM
 * - Import global styles
 *
 * REACT 18 FEATURES:
 * - Uses createRoot API (React 18+)
 * - Enables concurrent features
 * - Automatic batching
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./AuthContext";
import "./index.css";
import { ThemeProvider } from "./ThemeContext";

/**
 * STRICT MODE: Enables additional development checks
 *
 * BENEFITS:
 * - Identifies unsafe lifecycles
 * - Warns about deprecated APIs
 * - Detects unexpected side effects
 * - Only runs in development
 *
 * DOUBLE RENDERING: In dev, components render twice to detect issues
 * This is intentional and helps find bugs early
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
