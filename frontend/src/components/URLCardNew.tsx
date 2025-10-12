/**
 * URLCard Component - Beautiful Glass Morphism Design
 *
 * FEATURES:
 * - Glass morphism effect with backdrop blur
 * - Prominent copy button with animations
 * - Hover effects and micro-interactions
 * - Gradient accents
 * - Responsive design
 * - Dark mode support
 */

import { useState } from "react";
import type { ShortenedURL } from "../api";
import { api, APIError } from "../api";

interface URLCardProps {
  url: ShortenedURL;
  onEdit: (url: ShortenedURL) => void;
  onDelete: (shortCode: string) => void;
  onUpdate: (url: ShortenedURL) => void;
}

export function URLCard({ url, onEdit, onDelete, onUpdate }: URLCardProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<ShortenedURL | null>(null);

  // Build short URL - Use API method to get correct redirect URL
  const shortURL = api.getShortURL(url.shortCode);

  // Copy to clipboard with beautiful animation
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle redirect
  const handleRedirect = async () => {
    try {
      setLoading(true);
      await api.incrementAccess(url.shortCode);
      window.open(url.url, "_blank", "noopener,noreferrer");
      onUpdate({ ...url, accessCount: url.accessCount + 1 });
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Failed to open URL");
    } finally {
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this URL?")) return;

    try {
      setLoading(true);
      await api.deleteURL(url.shortCode);
      onDelete(url.shortCode);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Failed to delete URL");
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Toggle stats
  const handleToggleStats = async () => {
    if (!showStats) {
      try {
        setLoading(true);
        const fetchedStats = await api.getStats(url.shortCode);
        setStats(fetchedStats);
        setShowStats(true);
      } catch (err) {
        setError(err instanceof APIError ? err.message : "Failed to fetch stats");
      } finally {
        setLoading(false);
        setTimeout(() => setError(null), 3000);
      }
    } else {
      setShowStats(false);
    }
  };

  return (
    <div className="group relative animate-fade-in-up">
      {/* Glass Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:border-white/40 dark:hover:border-white/20">
        {/* Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400" />

        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 blur-xl transition-opacity duration-500 rounded-3xl" />

        <div className="relative p-6 space-y-4">
          {/* Header with Short URL */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>

            {/* Short URL */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Short URL
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white truncate">
                {shortURL}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge badge-outline badge-primary badge-sm font-mono uppercase tracking-wide">
                  {url.shortCode}
                </span>
                <span className="badge badge-outline badge-secondary badge-sm">
                  {url.accessCount} clicks
                </span>
              </div>
            </div>
          </div>

          {/* Original URL */}
          <div className="rounded-2xl bg-white/50 dark:bg-black/20 p-4 border border-white/20 dark:border-white/10">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Original URL
            </div>
            <a
              href={url.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 break-all transition-colors duration-200 hover:underline"
            >
              {url.url}
            </a>
          </div>

          {/* Copy Button - PROMINENT */}
          <button
            onClick={handleCopy}
            disabled={loading}
            className="relative w-full group/copy overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 p-[2px] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 dark:hover:shadow-purple-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 px-6 py-4 transition-all duration-300 group-hover/copy:bg-transparent">
              <div className="flex items-center justify-center gap-3">
                {copied ? (
                  <>
                    <svg
                      className="w-5 h-5 text-green-500 dark:text-green-400 animate-bounce-once"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover/copy:text-white transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-bold text-gray-700 dark:text-gray-300 group-hover/copy:text-white transition-colors duration-300">
                      Copy Short Link
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Open Button */}
            <button
              onClick={handleRedirect}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 group/btn"
              aria-label="Open URL"
            >
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover/btn:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Open
              </span>
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(url)}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 group/btn"
              aria-label="Edit URL"
            >
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover/btn:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Edit
              </span>
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95 group/btn"
              aria-label="Delete URL"
            >
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 group-hover/btn:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Delete
              </span>
            </button>
          </div>

          {/* Stats Toggle */}
          <button
            onClick={handleToggleStats}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                showStats ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showStats ? "Hide Statistics" : "View Statistics"}
          </button>

          {/* Stats Display */}
          {showStats && stats && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                {/* Access Count */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 p-4 border border-blue-200/30 dark:border-blue-500/20">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Clicks
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.accessCount}
                  </div>
                </div>

                {/* Created Date */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 p-4 border border-purple-200/30 dark:border-purple-500/20">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Created
                  </div>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {new Date(stats.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Short Code */}
              <div className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 dark:from-pink-500/5 dark:to-orange-500/5 p-4 border border-pink-200/30 dark:border-pink-500/20">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Short Code
                </div>
                <div className="text-lg font-mono font-bold text-pink-600 dark:text-pink-400">
                  {stats.shortCode}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-500/10 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 p-4 animate-shake">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
