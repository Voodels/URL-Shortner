/**
 * URLFormBrutal - NeoBrutalism Form Component
 *
 * DESIGN: Bold, industrial form with thick borders and hard shadows
 * FEATURES: Create/Edit URLs with brutal aesthetic
 */

import { FormEvent, useState } from "react";
import type { ShortenedURL } from "../api";

interface URLFormBrutalProps {
  onSubmit: (url: string, customCode?: string, categoryId?: string) => Promise<void>;
  editingURL: ShortenedURL | null;
  onCancelEdit: () => void;
  categories?: Array<{ id: string; name: string }>;
}

export function URLFormBrutal({
  onSubmit,
  editingURL,
  onCancelEdit,
  categories = []
}: URLFormBrutalProps) {
  const [url, setUrl] = useState(editingURL?.url || "");
  const [customCode, setCustomCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("URL REQUIRED");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(url, customCode || undefined, categoryId || undefined);

      // Clear form on success
      if (!editingURL) {
        setUrl("");
        setCustomCode("");
        setCategoryId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message.toUpperCase() : "FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUrl("");
    setCustomCode("");
    setCategoryId("");
    setError(null);
    onCancelEdit();
  };

  return (
    <div className="relative">
      {/* MAIN FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="bg-white border-brutal border-black brutal-shadow-lg p-6 space-y-6 brutal-texture">

        {/* HEADER BAR - Red accent */}
        <div className="h-3 bg-brutal-red border-b-brutal border-black -mx-6 -mt-6 mb-6"></div>

        {/* TITLE */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold text-black uppercase tracking-tight">
            {editingURL ? "✎ EDIT LINK" : "➕ NEW LINK"}
          </h2>

          {editingURL && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-black text-brutal-yellow font-brutal font-bold text-sm uppercase brutal-btn"
            >
              CANCEL
            </button>
          )}
        </div>

        {/* URL INPUT - Primary field */}
        <div className="space-y-2">
          <label className="font-brutal text-xs uppercase font-bold text-black">
            🌐 ORIGINAL URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very-long-url"
            required
            className="w-full px-4 py-4 bg-white border-brutal border-black font-mono text-base brutal-shadow-sm focus:brutal-shadow-yellow focus:border-brutal-yellow transition-all outline-none"
            disabled={loading}
          />
        </div>

        {/* CUSTOM CODE INPUT - Optional */}
        <div className="space-y-2">
          <label className="font-brutal text-xs uppercase font-bold text-black flex items-center gap-2">
            🔤 CUSTOM CODE
            <span className="text-xs font-normal opacity-60">(Optional)</span>
          </label>
          <input
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            placeholder="my-custom-link"
            pattern="[a-zA-Z0-9_-]+"
            className="w-full px-4 py-4 bg-brutal-yellow/20 border-brutal border-black font-mono text-base brutal-shadow-sm focus:brutal-shadow-blue focus:border-brutal-blue transition-all outline-none"
            disabled={loading || !!editingURL}
            maxLength={20}
          />
          <div className="font-mono text-xs text-black/60">
            {customCode ? `✓ ${customCode.length}/20 chars` : "Auto-generated if empty"}
          </div>
        </div>

        {/* CATEGORY SELECT */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="font-brutal text-xs uppercase font-bold text-black">
              📂 CATEGORY
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-4 bg-white border-brutal border-black font-brutal text-sm uppercase brutal-shadow-sm focus:brutal-shadow-green focus:border-brutal-green transition-all outline-none cursor-pointer"
              disabled={loading}
            >
              <option value="">-- NO CATEGORY --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="uppercase">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-brutal-red border-brutal border-black p-4 brutal-shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">❌</span>
              <span className="font-brutal text-sm font-bold text-white uppercase">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON - Large and prominent */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-brutal-yellow text-black font-display text-xl font-bold uppercase brutal-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳ PROCESSING..." : editingURL ? "💾 UPDATE LINK" : "🚀 CREATE LINK"}
        </button>

        {/* INFO BOX - Bottom tip */}
        <div className="bg-brutal-blue/10 border-4 border-brutal-blue p-4 brutal-shadow-sm">
          <div className="font-brutal text-xs font-bold text-black uppercase">
            💡 TIP: Custom codes are permanent and cannot be changed later.
          </div>
        </div>
      </form>

      {/* DECORATIVE OFFSET BACKGROUND */}
      <div className="absolute -bottom-2 -right-2 w-full h-full bg-brutal-blue border-brutal border-black -z-10"></div>
    </div>
  );
}
