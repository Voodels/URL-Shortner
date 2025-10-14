/**
 * URLCard Component - Displays a shortened URL with actions
 *
 * DESIGN PATTERNS:
 * 1. Presentational Component: Receives data via props, emits events
 * 2. Compound Component: Multiple sections (info, actions, stats)
 * 3. Optimistic UI: Immediate visual feedback
 *
 * FEATURES:
 * - Copy to clipboard functionality
 * - Redirect with analytics tracking
 * - Edit and delete actions
 * - Statistics display
 * - Responsive design
 *
 * ACCESSIBILITY:
 * - Semantic HTML
 * - ARIA labels for icon buttons
 * - Keyboard navigation
 * - Focus management
 */

import { useEffect, useState } from "react";
import type { ShortenedURL } from "../api";
import { api, APIError } from "../api";

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface URLCardProps {
  /**
   * The shortened URL data to display
   */
  url: ShortenedURL;

  /**
   * Callback when edit button is clicked
   * PATTERN: Parent controls edit state
   */
  onEdit: (url: ShortenedURL) => void;

  /**
   * Callback when URL is deleted
   * PATTERN: Parent removes from list
   */
  onDelete: (shortCode: string) => void;

  /**
   * Callback when URL is updated (for refreshing stats)
   * PATTERN: Parent updates the URL in list
   */
  onUpdate: (url: ShortenedURL) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Card component displaying shortened URL with actions
 *
 * STATE MANAGEMENT:
 * - copied: Clipboard copy feedback
 * - loading: Action in progress
 * - error: Error message
 * - stats: Statistics data
 */
export function URLCard({ url, onEdit, onDelete, onUpdate }: URLCardProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * CLIPBOARD FEEDBACK: Shows "Copied!" temporarily
   * AUTO-RESET: After 2 seconds
   */
  const [copied, setCopied] = useState(false);

  /**
   * LOADING STATE: Shows spinner on delete/redirect
   */
  const [loading, setLoading] = useState(false);

  /**
   * ERROR STATE: Shows error messages
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * STATS VISIBILITY: Toggle statistics display
   * LAZY LOADING: Only fetch when opened
   */
  const [showStats, setShowStats] = useState(false);

  /**
   * STATS DATA: Fetched statistics
   */
  const [stats, setStats] = useState<ShortenedURL | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * REAL-TIME STATS POLLING
   * Polls the backend every 5 seconds to get updated click counts
   * Only polls when stats panel is open
   */
  useEffect(() => {
    if (!showStats) return;

    // Fetch stats immediately when panel opens
    const fetchStats = async () => {
      try {
        const updated = await api.getStats(url.shortCode);
        setStats(updated);
        onUpdate(updated); // Update parent's list too
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();

    // Poll every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [showStats, url.shortCode, onUpdate]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Build full short URL for display
   * ENHANCEMENT: Could use custom domain if configured
   */
  const shortURL = api.getShortURL(url.shortCode);

  /**
   * Format date for display
   * UX: Human-readable date format
   */
  const formatDate = (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Copy short URL to clipboard
   *
   * MODERN API: Uses navigator.clipboard (requires HTTPS in production)
   * FALLBACK: Could add document.execCommand fallback for older browsers
   * UX: Shows visual feedback
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortURL);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Redirect to original URL and track analytics
   *
   * FLOW:
   * 1. Increment access counter (async)
   * 2. Open original URL in new tab
   * 3. Fetch updated stats
   *
   * DESIGN DECISION: Open in new tab vs same tab
   * WHY: Keeps app open, allows multiple redirects
   * ALTERNATIVE: window.location.href for same tab
   */
  const handleRedirect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Increment access count asynchronously
      // NON-BLOCKING: Don't wait, redirect immediately
      api.incrementAccess(url.shortCode).catch(console.error);

      // Open in new tab
      // SECURITY: noopener noreferrer prevents reverse tabnabbing
      window.open(url.url, "_blank", "noopener,noreferrer");

      // Fetch updated stats after a short delay
      // TIMING: Allow backend to process increment
      setTimeout(async () => {
        try {
          const updated = await api.getStats(url.shortCode);
          onUpdate(updated);
        } catch (err) {
          console.error("Failed to fetch updated stats:", err);
        } finally {
          setLoading(false);
        }
      }, 500);

    } catch (err) {
      setLoading(false);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("Failed to redirect");
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Delete shortened URL
   *
   * CONFIRMATION: Could add confirmation dialog
   * OPTIMISTIC UI: Immediately notify parent to remove from list
   * ERROR HANDLING: Could restore on error
   */
  const handleDelete = async () => {
    // FUTURE: Add confirmation dialog
    // if (!confirm("Are you sure you want to delete this short URL?")) return;

    setLoading(true);
    setError(null);

    try {
      await api.deleteURL(url.shortCode);

      // Notify parent to remove from list
      onDelete(url.shortCode);
    } catch (err) {
      setLoading(false);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("Failed to delete URL");
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Toggle statistics display
   *
   * LAZY LOADING: Fetch stats only when opened for first time
   * CACHING: Store stats in state to avoid refetching
   */
  const handleToggleStats = async () => {
    const newShowStats = !showStats;
    setShowStats(newShowStats);

    // Fetch stats if opening and not already loaded
    if (newShowStats && !stats) {
      try {
        const fetchedStats = await api.getStats(url.shortCode);
        setStats(fetchedStats);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError("Failed to fetch statistics");
        }
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", url.shortCode);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className="card bg-base-100 shadow-xl cursor-move hover:shadow-2xl transition-shadow"
      draggable={true}
      onDragStart={handleDragStart}
    >
      <div className="card-body">
        {/* HEADER: Short URL and actions */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* SHORT URL */}
            <h3 className="card-title text-primary break-all">
              {url.shortCode}
            </h3>

            {/* ORIGINAL URL */}
            <p className="text-sm text-base-content/70 break-all mt-1">
              {url.url}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2 flex-shrink-0">
            {/* COPY BUTTON */}
            <button
              onClick={handleCopy}
              className="btn btn-sm btn-ghost"
              disabled={loading}
              aria-label="Copy short URL"
              title="Copy to clipboard"
            >
              {copied ? (
                // SUCCESS ICON: Checkmark
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                // COPY ICON: Clipboard
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>

            {/* EDIT BUTTON */}
            <button
              onClick={() => onEdit(url)}
              className="btn btn-sm btn-ghost"
              disabled={loading}
              aria-label="Edit URL"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

            {/* DELETE BUTTON */}
            <button
              onClick={handleDelete}
              className="btn btn-sm btn-ghost text-error"
              disabled={loading}
              aria-label="Delete URL"
              title="Delete"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="alert alert-error alert-sm mt-2" role="alert">
            <span className="text-xs">{error}</span>
          </div>
        )}

        {/* METADATA */}
        <div className="flex flex-wrap gap-4 text-xs text-base-content/60 mt-2">
          <div>
            <span className="font-semibold">Created:</span>{" "}
            {formatDate(url.createdAt)}
          </div>
          <div>
            <span className="font-semibold">Updated:</span>{" "}
            {formatDate(url.updatedAt)}
          </div>
          <div>
            <span className="font-semibold">Clicks:</span> {url.accessCount}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="card-actions justify-between mt-4">
          {/* STATISTICS BUTTON */}
          <button
            onClick={handleToggleStats}
            className="btn btn-sm btn-outline"
            disabled={loading}
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>

          {/* REDIRECT BUTTON */}
          <button
            onClick={handleRedirect}
            className="btn btn-sm btn-primary"
            disabled={loading}
          >
            Visit URL
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </div>

        {/* STATISTICS PANEL */}
        {showStats && (
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <h4 className="font-semibold mb-2">Statistics</h4>
            {stats ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Clicks:</span>
                  <span className="font-semibold">{stats.accessCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Short Code:</span>
                  <code className="font-mono text-xs">{stats.shortCode}</code>
                </div>
                <div className="flex justify-between">
                  <span>Full Short URL:</span>
                  <code className="font-mono text-xs break-all">{shortURL}</code>
                </div>
                {/* FUTURE ENHANCEMENTS:
                  - Click-through rate
                  - Geographic distribution
                  - Referrer sources
                  - Time-series graph
                */}
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
