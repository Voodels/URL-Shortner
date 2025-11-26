/**
 * URLCardBrutal - NeoBrutalism Design Component
 *
 * DESIGN PHILOSOPHY:
 * - High-contrast colors (black/white with bold accent colors)
 * - Thick borders with hard shadows (no blur)
 * - Asymmetric layout with geometric shapes
 * - Raw, industrial typography
 * - Deliberately "unpolished" aesthetics
 *
 * CHARACTERISTICS:
 * - 4-6px borders in pure black
 * - Hard box shadows (8px offset, no blur)
 * - Electric yellow, harsh red, industrial blue accents
 * - Monospace/heavy fonts
 * - Intentional asymmetry and offset elements
 */

import { useState } from "react";
import type { ShortenedURL } from "../api";
import { api, APIError } from "../api";

interface URLCardBrutalProps {
  url: ShortenedURL;
  onEdit: (url: ShortenedURL) => void;
  onDelete: (shortCode: string) => void;
  onUpdate: (url: ShortenedURL) => void;
}

export function URLCardBrutal({ url, onEdit, onDelete, onUpdate }: URLCardBrutalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const shortURL = api.getShortURL(url.shortCode);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy");
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
      setError(err instanceof APIError ? err.message : "Failed to open");
    } finally {
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Delete this URL?")) return;

    try {
      setLoading(true);
      await api.deleteURL(url.shortCode);
      onDelete(url.shortCode);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Failed to delete");
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="relative">
      {/* MAIN CARD - Brutal styling */}
      <div className="bg-white border-brutal border-black brutal-shadow relative overflow-hidden brutal-texture">

        {/* TOP ACCENT BAR - Electric Yellow */}
        <div className="h-3 bg-brutal-yellow border-b-brutal border-black"></div>

        {/* CARD CONTENT */}
        <div className="p-6 space-y-4">

          {/* HEADER WITH SHORT CODE */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* SHORT CODE - Oversized, monospace */}
              <div className="font-brutal text-3xl font-bold text-black uppercase tracking-wider break-all brutal-text">
                {url.shortCode}
              </div>

              {/* CLICK COUNTER - Red badge with hard shadow */}
              <div className="inline-block mt-3 px-4 py-2 bg-brutal-red text-white font-brutal font-bold text-sm border-4 border-black brutal-shadow-sm">
                {url.accessCount} CLICKS
              </div>
            </div>

            {/* ICON - Geometric shape with offset */}
            <div className="w-16 h-16 bg-brutal-blue border-4 border-black brutal-shadow-sm flex items-center justify-center font-brutal text-2xl font-bold brutal-offset-1">
              🔗
            </div>
          </div>

          {/* ORIGINAL URL - White box with thick border */}
          <div className="bg-white border-4 border-black p-4 brutal-shadow-sm">
            <div className="font-brutal text-xs uppercase font-bold mb-2 text-brutal-orange">
              ORIGINAL URL
            </div>
            <a
              href={url.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-black hover:text-brutal-blue break-all underline decoration-2 decoration-brutal-blue"
            >
              {url.url}
            </a>
          </div>

          {/* SHORT URL DISPLAY - Yellow highlight */}
          <div className="bg-brutal-yellow border-4 border-black p-4 brutal-shadow-sm">
            <div className="font-brutal text-xs uppercase font-bold mb-2 text-black">
              SHORT URL
            </div>
            <div className="font-mono text-base font-bold text-black break-all">
              {shortURL}
            </div>
          </div>

          {/* COPY BUTTON - PROMINENT with brutal styling */}
          <button
            onClick={handleCopy}
            disabled={loading}
            className={`w-full py-4 font-brutal font-bold text-lg uppercase brutal-btn transition-all ${
              copied
                ? "bg-brutal-green text-black"
                : "bg-brutal-yellow text-black hover:bg-brutal-orange"
            }`}
          >
            {copied ? "✓ COPIED!" : "📋 COPY LINK"}
          </button>

          {/* ACTION BUTTONS ROW - Asymmetric grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* OPEN BUTTON */}
            <button
              onClick={handleRedirect}
              disabled={loading}
              className="py-3 bg-brutal-blue text-white font-brutal font-bold text-xs uppercase brutal-btn"
              title="Open URL"
            >
              OPEN
            </button>

            {/* EDIT BUTTON */}
            <button
              onClick={() => onEdit(url)}
              disabled={loading}
              className="py-3 bg-white text-black font-brutal font-bold text-xs uppercase brutal-btn"
              title="Edit"
            >
              EDIT
            </button>

            {/* DELETE BUTTON */}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="py-3 bg-brutal-red text-white font-brutal font-bold text-xs uppercase brutal-btn"
              title="Delete"
            >
              {loading ? "..." : "DELETE"}
            </button>
          </div>

          {/* STATS TOGGLE */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full py-3 bg-black text-brutal-yellow font-brutal font-bold text-sm uppercase brutal-btn"
          >
            {showStats ? "▲ HIDE STATS" : "▼ SHOW STATS"}
          </button>

          {/* STATS DISPLAY - Industrial grid */}
          {showStats && (
            <div className="brutal-grid bg-base-200 border-4 border-black p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* ACCESS COUNT */}
                <div className="bg-brutal-blue border-4 border-black p-3 brutal-shadow-sm">
                  <div className="font-brutal text-xs uppercase font-bold text-white mb-1">
                    Clicks
                  </div>
                  <div className="font-display text-2xl font-bold text-white">
                    {url.accessCount}
                  </div>
                </div>

                {/* CREATED DATE */}
                <div className="bg-brutal-red border-4 border-black p-3 brutal-shadow-sm">
                  <div className="font-brutal text-xs uppercase font-bold text-white mb-1">
                    Created
                  </div>
                  <div className="font-brutal text-sm font-bold text-white">
                    {new Date(url.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* SHORT CODE BOX */}
              <div className="bg-brutal-yellow border-4 border-black p-3 brutal-shadow-sm brutal-offset-2">
                <div className="font-brutal text-xs uppercase font-bold text-black mb-1">
                  Code
                </div>
                <div className="font-mono text-lg font-bold text-black">
                  {url.shortCode}
                </div>
              </div>
            </div>
          )}

          {/* ERROR MESSAGE - Red alert box */}
          {error && (
            <div className="bg-brutal-red border-4 border-black p-4 brutal-shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <span className="font-brutal text-sm font-bold text-white uppercase">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* METADATA - Bottom bar */}
          <div className="flex gap-4 text-xs font-mono text-black/60 pt-2 border-t-4 border-black">
            <span>UPDATED: {new Date(url.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="w-20 h-20 border-8 border-brutal-yellow border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>

      {/* DECORATIVE OFFSET BACKGROUND - Creates depth illusion */}
      <div className="absolute -bottom-2 -right-2 w-full h-full bg-brutal-yellow border-brutal border-black -z-10"></div>
    </div>
  );
}
