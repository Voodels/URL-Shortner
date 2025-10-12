/**
 * URLForm Component - Beautiful Glass Morphism Design
 *
 * FEATURES:
 * - Glass morphism effect
 * - Smooth animations
 * - Beautiful gradients
 * - Loading states
 * - Success/error feedback
 */

import { FormEvent, useEffect, useState } from "react";
import type { ShortenedURL } from "../api";
import { api, APIError } from "../api";

interface URLFormProps {
  onURLCreated: (url: ShortenedURL) => void;
  editingURL?: ShortenedURL | null;
  onCancelEdit?: () => void;
}

export function URLForm({ onURLCreated, editingURL, onCancelEdit }: URLFormProps) {
  const [url, setUrl] = useState(editingURL?.url || "");
  useEffect(() => {
    if (editingURL) {
      setUrl(editingURL.url);
    } else {
      setUrl("");
    }
  }, [editingURL]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      setLoading(true);

      let result: ShortenedURL;
      if (editingURL) {
        result = await api.updateURL(editingURL.shortCode, url.trim());
      } else {
        result = await api.createShortURL(url.trim());
      }

      onURLCreated(result);
      setSuccess(true);

      if (!editingURL) {
        setUrl("");
      }

      setTimeout(() => setSuccess(false), 3000);

      if (editingURL && onCancelEdit) {
        setTimeout(() => onCancelEdit(), 1500);
      }
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Failed to shorten URL");
    } finally {
      setLoading(false);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="relative animate-fade-in-down">
      {/* Glass Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
        {/* Gradient Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400" />

        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 animate-gradient-shift" />

        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              {editingURL ? "✏️ Edit URL" : "✨ Shorten a URL"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {editingURL
                ? "Update your shortened URL destination"
                : "Transform long URLs into short, shareable links"}
            </p>

            <div className="divider mx-auto w-1/2">
              <span className="badge badge-outline badge-secondary">
                Workflow
              </span>
            </div>

            <ul className="steps steps-vertical sm:steps-horizontal w-full justify-center text-xs">
              <li className="step step-primary">Paste long URL</li>
              <li className={`step ${editingURL ? "step-secondary" : "step-info"}`}>
                {editingURL ? "Tweak destination" : "Customize"}
              </li>
              <li className="step">Share everywhere</li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL Input with Glass Effect */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-focus-within:opacity-20 dark:group-focus-within:opacity-10 blur-xl transition-opacity duration-500" />

              <div className="relative rounded-2xl bg-white/50 dark:bg-white/5 border-2 border-white/20 dark:border-white/10 focus-within:border-purple-500/50 dark:focus-within:border-purple-400/50 transition-all duration-300 overflow-hidden">
                {/* Icon */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
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

                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/very-long-url"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  aria-label="URL to shorten"
                  required
                />
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-3">
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex-1 relative group/btn overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 p-[2px] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 dark:hover:shadow-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative rounded-2xl bg-white dark:bg-gray-900 px-6 py-4 transition-all duration-300 group-hover/btn:bg-transparent">
                  <div className="flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-purple-500 rounded-full animate-spin" />
                        <span className="font-bold text-gray-700 dark:text-gray-300 group-hover/btn:text-white transition-colors duration-300">
                          {editingURL ? "Updating..." : "Processing..."}
                        </span>
                      </>
                    ) : success ? (
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
                          Success!
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover/btn:text-white transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span className="font-bold text-gray-700 dark:text-gray-300 group-hover/btn:text-white transition-colors duration-300">
                          {editingURL ? "Update URL" : "Shorten URL"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {/* Cancel Button (only in edit mode) */}
              {editingURL && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={loading}
                  className="px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 font-bold text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
            </div>

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

            {/* Success Message */}
            {success && !editingURL && (
              <div className="rounded-2xl bg-green-500/10 dark:bg-green-500/20 border border-green-300 dark:border-green-500/30 p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 animate-bounce-once"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    URL shortened successfully! Scroll down to see your new link.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
