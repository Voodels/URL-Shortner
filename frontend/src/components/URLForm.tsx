/**
 * URLForm Component - Form for creating and updating shortened URLs
 *
 * DESIGN PATTERNS:
 * 1. Controlled Components: React manages form state
 * 2. Optimistic UI: Shows immediate feedback
 * 3. Error Boundaries: Graceful error handling
 *
 * ACCESSIBILITY:
 * - Semantic HTML (form, label, input)
 * - ARIA labels and roles
 * - Keyboard navigation support
 * - Screen reader friendly error messages
 *
 * UX CONSIDERATIONS:
 * - Clear visual feedback (loading, success, error states)
 * - Disabled submit during request (prevents double submission)
 * - Auto-focus on input for quick usage
 * - Input validation feedback
 */

import { FormEvent, useState } from "react";
import type { CategoryWithCount, ShortenedURL } from "../api";
import { api, APIError } from "../api";

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface URLFormProps {
  /**
   * Callback when URL is successfully created
   * PATTERN: Lifting state up - parent controls URL list
   */
  onURLCreated: (url: ShortenedURL) => void;

  /**
   * Optional: Existing URL for editing
   * DUAL MODE: Create mode (undefined) or Edit mode (provided)
   */
  editingURL?: ShortenedURL;

  /**
   * Callback when editing is cancelled
   */
  onCancelEdit?: () => void;

  /**
   * Optional: Available categories for organizing URLs
   */
  categories?: CategoryWithCount[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Form component for creating/editing shortened URLs
 *
 * STATE MANAGEMENT:
 * - url: Input field value
 * - loading: Request in progress
 * - error: Error message to display
 * - success: Success message to display
 *
 * LIFECYCLE:
 * - Mount: Initialize with editing URL if provided
 * - Submit: Validate, call API, handle response
 * - Unmount: Clean up (handled by React)
 */
export function URLForm({ onURLCreated, editingURL, onCancelEdit, categories = [] }: URLFormProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * CONTROLLED COMPONENT: React manages input value
   * WHY: Allows validation, transformation, and controlled updates
   */
  const [url, setUrl] = useState(editingURL?.url || "");

  /**
   * CATEGORY SELECTION: Track selected category IDs
   * MULTI-SELECT: Users can organize URLs with multiple categories
   */
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  /**
   * LOADING STATE: Prevents duplicate submissions
   * UX: Shows spinner, disables form during request
   */
  const [loading, setLoading] = useState(false);

  /**
   * ERROR STATE: User-friendly error messages
   * CLEARED: On new input or successful submission
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * SUCCESS STATE: Confirmation message
   * AUTO-CLEAR: After 3 seconds
   */
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Toggle category selection
   */
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle form submission
   *
   * FLOW:
   * 1. Prevent default form submission
   * 2. Validate input
   * 3. Set loading state
   * 4. Call API (create or update)
   * 5. Handle success or error
   * 6. Clear loading state
   *
   * ERROR HANDLING:
   * - Validation errors: Show inline
   * - API errors: Show from server response
   * - Network errors: Show generic message
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Client-side validation
    // REDUNDANT: Server also validates, but better UX to catch early
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL format check
    // ENHANCEMENT: Could use more sophisticated validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    // Start loading
    setLoading(true);

    try {
      let result: ShortenedURL;

      if (editingURL) {
        // UPDATE MODE: Call update API
        result = await api.updateURL(editingURL.shortCode, url, selectedCategoryIds);
        setSuccess("URL updated successfully!");
      } else {
        // CREATE MODE: Call create API
        result = await api.createShortURL(url, selectedCategoryIds);
        setSuccess("Short URL created successfully!");

        // Clear input and categories after successful creation
        setUrl("");
        setSelectedCategoryIds([]);
      }

      // Notify parent component
      onURLCreated(result);

      // Auto-clear success message after 3 seconds
      // UX: Don't distract user with persistent success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      // Handle API errors with user-friendly messages
      if (err instanceof APIError) {
        // Show detailed validation errors if available
        if (err.details && err.details.length > 0) {
          setError(err.details.join(", "));
        } else {
          setError(err.message);
        }
      } else {
        // Generic error message for unexpected errors
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      // Always clear loading state
      setLoading(false);
    }
  };

  /**
   * Handle cancel editing
   *
   * CLEANUP: Clear form state and notify parent
   */
  const handleCancel = () => {
    setUrl("");
    setError(null);
    setSuccess(null);
    onCancelEdit?.();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* HEADER: Different title for create/edit mode */}
        <h2 className="card-title">
          {editingURL ? "Edit URL" : "Shorten a URL"}
        </h2>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL INPUT */}
          <div className="form-control">
            <label htmlFor="url-input" className="label">
              <span className="label-text">Enter your long URL</span>
            </label>
            <input
              id="url-input"
              type="text"
              placeholder="https://example.com/very/long/url"
              className="input input-bordered w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
              aria-label="URL to shorten"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "url-error" : undefined}
            />
            {/*
              ACCESSIBILITY: aria-describedby links input to error message
              SCREEN READERS: Will announce error when input is focused
            */}
          </div>

          {/* CATEGORY SELECTION */}
          {categories.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <span className="text-lg">🏷️</span>
                  Organize with Categories (Optional)
                </span>
                {selectedCategoryIds.length > 0 && (
                  <span className="badge badge-sm badge-primary">
                    {selectedCategoryIds.length} selected
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      disabled={loading}
                      className={`
                        btn btn-sm gap-2 transition-all duration-200
                        ${isSelected
                          ? `btn-${category.color} shadow-lg`
                          : 'btn-outline btn-ghost'
                        }
                      `}
                    >
                      <span className="text-base">{category.icon}</span>
                      <span>{category.name}</span>
                      {isSelected && (
                        <svg
                          className="w-4 h-4"
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
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div
              id="url-error"
              className="alert alert-error"
              role="alert"
              aria-live="assertive"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div
              className="alert alert-success"
              role="alert"
              aria-live="polite"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* SUBMIT BUTTON(S) */}
          <div className="card-actions justify-end">
            {editingURL && (
              // CANCEL BUTTON: Only shown in edit mode
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !url.trim()}
              aria-busy={loading}
            >
              {loading ? (
                // LOADING STATE: Show spinner
                <>
                  <span className="loading loading-spinner"></span>
                  {editingURL ? "Updating..." : "Creating..."}
                </>
              ) : (
                // NORMAL STATE: Show action text
                editingURL ? "Update" : "Shorten"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
