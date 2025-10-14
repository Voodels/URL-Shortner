/**
 * App Component - Main Application Container
 *
 * RESPONSIBILITIES:
 * - Manage authentication and show appropriate views
 * - Orchestrate URL CRUD workflow between form and card list
 * - Provide analytics snapshot and theme-aware chrome
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, APIError, type CategoryWithCount, type ShortenedURL } from "./api";
import { useAuth } from "./AuthContext";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { CategoryManager } from "./components/CategoryManager";
import { CategoryTabs } from "./components/CategoryTabs";
import { ThemeToggle } from "./components/ThemeToggle";
import { URLCard } from "./components/URLCard";
import { URLForm } from "./components/URLForm";
import { useTheme } from "./ThemeContext";

type AuthMode = "login" | "register";

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export default function App() {
  const { user, isAuthenticated, isInitializing, isAuthLoading, login, register } = useAuth();
  const { mode, colorTheme } = useTheme();

  const [urlsState, setUrlsState] = useState<AsyncState<ShortenedURL[]>>({
    data: [],
    loading: false,
    error: null,
  });
  const [editingURL, setEditingURL] = useState<ShortenedURL | undefined>(undefined);

  // Category state
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  // Load categories when authenticated
  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setCategories([]);
      return;
    }

    async function fetchCategories() {
      try {
        const { categories: cats } = await api.getCategories();
        if (!cancelled) {
          setCategories(cats);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setUrlsState((prev) => ({ ...prev, data: [], error: null }));
      return;
    }

    async function fetchUrls() {
      setUrlsState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        // Fetch filtered or all URLs based on selected category
        const { urls } = selectedCategoryId
          ? await api.getURLsByCategory(selectedCategoryId)
          : await api.getUserURLs();

        if (!cancelled) {
          setUrlsState({ data: urls, loading: false, error: null });
        }
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof APIError
            ? error.message
            : "Failed to load your URLs. Please try again.";
        setUrlsState((prev) => ({ ...prev, loading: false, error: message }));
      }
    }

    fetchUrls();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, selectedCategoryId]);

  // =============================================================================
  // DERIVED DATA
  // =============================================================================

  const totalClicks = useMemo(
    () => urlsState.data.reduce((sum, url) => sum + url.accessCount, 0),
    [urlsState.data]
  );

  const topPerformer = useMemo(() => {
    if (urlsState.data.length === 0) return null;
    return urlsState.data.reduce((best, current) =>
      current.accessCount > best.accessCount ? current : best
    );
  }, [urlsState.data]);

  const formattedThemeName = `${colorTheme.charAt(0).toUpperCase()}${colorTheme.slice(1)}`;

  // =============================================================================
  // AUTH HANDLERS
  // =============================================================================

  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "register" : "login"));
    setAuthError(null);
  };

  const switchToMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    const credentials = {
      email: authEmail.trim(),
      password: authPassword,
    };

    const action = authMode === "login" ? login : register;

    try {
      await action(credentials);
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      if (error instanceof APIError) {
        setAuthError(error.message);
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
    }
  };

  // =============================================================================
  // URL EVENT HANDLERS
  // =============================================================================

  const handleURLCreated = async (url: ShortenedURL) => {
    if (editingURL) {
      setUrlsState((prev) => ({
        ...prev,
        data: prev.data.map((existing) =>
          existing.shortCode === url.shortCode ? url : existing
        ),
      }));
      setEditingURL(undefined);
    } else {
      setUrlsState((prev) => ({
        ...prev,
        data: [url, ...prev.data],
      }));
    }

    // Refresh categories to update URL counts
    try {
      const { categories: cats } = await api.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to refresh categories:", error);
    }
  };

  const handleEdit = (url: ShortenedURL) => {
    setEditingURL(url);
  };

  const handleCancelEdit = () => {
    setEditingURL(undefined);
  };

  const handleDelete = async (shortCode: string) => {
    setUrlsState((prev) => ({
      ...prev,
      data: prev.data.filter((url) => url.shortCode !== shortCode),
    }));

    if (editingURL?.shortCode === shortCode) {
      setEditingURL(undefined);
    }

    // Refresh categories to update URL counts
    try {
      const { categories: cats } = await api.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to refresh categories:", error);
    }
  };

  const handleUpdate = (url: ShortenedURL) => {
    setUrlsState((prev) => ({
      ...prev,
      data: prev.data.map((existing) =>
        existing.shortCode === url.shortCode ? url : existing
      ),
    }));
  };

  // =============================================================================
  // DRAG AND DROP HANDLERS
  // =============================================================================

  const handleDropOnCategory = async (shortCode: string, categoryId: string) => {
    try {
      // Add the URL to the category
      await api.addCategoriesToURL(shortCode, [categoryId]);

      // Refresh categories to update counts
      const { categories: cats } = await api.getCategories();
      setCategories(cats);

      // Show success feedback (optional)
      console.log(`Added ${shortCode} to category ${categoryId}`);
    } catch (error) {
      console.error("Failed to add URL to category:", error);
      // Could show an error toast here
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  if (isInitializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-200 text-base-content">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-base-content/70 text-sm">Preparing your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-base-200 text-base-content transition-colors duration-500">
        <AnimatedBackground />
        <ThemeToggle />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 blur-3xl opacity-70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <section className="flex flex-col items-center gap-10 text-center md:items-start md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                Launch faster
                <span className="inline-flex items-center gap-1 text-white/90">
                  with flair
                  <span aria-hidden="true">⚡</span>
                </span>
              </div>

              <div className="space-y-3 sm:space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.6em] text-white/60 sm:text-sm">
                  LinkStudio
                </p>
                <h1 className="font-hero font-hero-glow text-[clamp(3rem,7vw,6rem)] leading-tight text-white">
                  Make every link feel handwritten
                </h1>
                <p className="text-base font-semibold text-white/80 sm:text-lg md:text-xl">
                  Transform long URLs into luminous, trackable stories. Share with confidence on socials, newsletters, and product launches.
                </p>
              </div>

              <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-start sm:gap-4">
                <button
                  type="button"
                  className="btn btn-success btn-wide shadow-lg shadow-emerald-400/30 sm:btn-lg"
                  onClick={() => switchToMode("register")}
                >
                  Create my studio
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-wide text-white/80 hover:bg-white/20 sm:btn-lg sm:w-auto"
                  onClick={() => switchToMode("login")}
                >
                  I already have an account
                </button>
              </div>

              <div className="w-full max-w-xl rounded-3xl bg-white/10 p-6 text-left shadow-2xl backdrop-blur-xl md:bg-white/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="badge badge-success badge-outline">Case study</span>
                    <p className="mt-2 text-sm text-white/80">
                      “We saw 2× more clicks the week we switched to LinkStudio short links.”
                    </p>
                  </div>
                  <div className="text-xs text-white/70">@AuroraCollective</div>
                </div>
              </div>
            </section>

            <aside className="relative mt-6 w-full lg:mt-0">
              <div
                className="pointer-events-none absolute -inset-1 rounded-[32px] bg-hero-gradient opacity-80 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative rounded-[28px] border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85">
                <div className="mb-6 space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {authMode === "login" ? "Welcome back" : "Create your studio"}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {authMode === "login"
                      ? "Sign in to manage your branded URLs"
                      : "Register to craft gorgeous, trackable short links"}
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleAuthSubmit}>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-slate-600 dark:text-slate-200">Email</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full bg-white/80 focus:outline-primary dark:bg-slate-900/60"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-slate-600 dark:text-slate-200">Password</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full bg-white/80 focus:outline-primary dark:bg-slate-900/60"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                    />
                  </div>

                  {authError && (
                    <div className="alert alert-error shadow-lg">
                      <span>{authError}</span>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-block" disabled={isAuthLoading}>
                    {isAuthLoading
                      ? authMode === "login"
                        ? "Signing in..."
                        : "Creating account..."
                      : authMode === "login"
                      ? "Sign in"
                      : "Create account"}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-300">
                  {authMode === "login" ? (
                    <p>
                      Need an account?{" "}
                      <button type="button" className="link link-primary" onClick={toggleAuthMode}>
                        Register now
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button type="button" className="link link-primary" onClick={toggleAuthMode}>
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // AUTHENTICATED EXPERIENCE
  // =============================================================================

  return (
    <div className="min-h-screen bg-base-200 text-base-content transition-colors duration-500">
      <AnimatedBackground />
      <ThemeToggle />

      <header className="relative z-10">
        <div className="hero relative py-16">
          <div className="hero-content text-center max-w-3xl">
            <div className="mx-auto">
              <div className="flex justify-center mb-4">
                <span className="badge badge-lg badge-primary badge-outline gap-2 px-6 py-4 shadow-lg">
                  <span className="text-xl">🚀</span>
                  <span className="font-semibold tracking-wide">Next-gen link management</span>
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  URL Shortener Studio
                </span>
              </h1>
              <p className="mt-6 text-lg text-base-content/70">
                Craft dazzling short links with real-time analytics, gorgeous themes, and delightful micro-interactions powered by DaisyUI.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <div className="tooltip" data-tip="Switch between immersive palettes">
                  <span className="badge badge-secondary badge-outline px-4 py-3">
                    Current palette: {formattedThemeName}
                  </span>
                </div>
                <div className="tooltip" data-tip="Dark or light with one tap">
                  <span className="badge badge-accent badge-outline px-4 py-3">
                    Mode: {mode === "light" ? "Sunlit" : "Midnight"}
                  </span>
                </div>
                {user && (
                  <div className="tooltip" data-tip="You are signed in">
                    <span className="badge badge-outline px-4 py-3">{user.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 container mx-auto px-4 -mt-10 mb-14">
        <div className="stats stats-vertical lg:stats-horizontal shadow-xl bg-base-100/70 backdrop-blur-xl border border-base-300/40">
          <div className="stat">
            <div className="stat-figure text-primary">
              <span className="text-3xl">📦</span>
            </div>
            <div className="stat-title">Short links created</div>
            <div className="stat-value text-primary">
              {urlsState.loading ? "--" : urlsState.data.length.toString().padStart(2, "0")}
            </div>
            <div className="stat-desc">
              {urlsState.loading ? "Loading your collection..." : "Crafted in this session"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <span className="text-3xl">🔥</span>
            </div>
            <div className="stat-title">Total clicks recorded</div>
            <div className="stat-value text-secondary">{urlsState.loading ? "--" : totalClicks}</div>
            <div className="stat-desc">
              {urlsState.loading
                ? "Crunching the numbers..."
                : totalClicks > 0
                ? "Keep the momentum!"
                : "Awaiting the first click"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">
              <span className="text-3xl">🌟</span>
            </div>
            <div className="stat-title">Most loved link</div>
            <div className="stat-value text-accent text-sm md:text-xl">
              {urlsState.loading ? "--" : topPerformer ? topPerformer.shortCode : "TBD"}
            </div>
            <div className="stat-desc truncate w-56">
              {urlsState.loading
                ? "Fetching your highlights"
                : topPerformer
                ? topPerformer.url
                : "Add links to unlock stats"}
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 container mx-auto px-4 pb-16">
        <section className="mb-12">
          <div className="card glass shadow-2xl border border-base-200/40">
            <div className="card-body">
              <URLForm
                onURLCreated={handleURLCreated}
                editingURL={editingURL}
                onCancelEdit={handleCancelEdit}
                categories={categories}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-4xl">🧾</span>
                <span>Your Shortened URLs</span>
                {urlsState.data.length > 0 && (
                  <span className="badge badge-primary badge-outline">{urlsState.data.length}</span>
                )}
              </h2>
              <p className="mt-1 text-base-content/70">Manage, customize, and explore analytics for every link.</p>
            </div>

            {/* Category Manager with built-in button */}
            <CategoryManager
              categories={categories}
              onCategoryCreated={async () => {
                try {
                  const { categories: cats } = await api.getCategories();
                  setCategories(cats);
                } catch (error) {
                  console.error("Failed to refresh categories:", error);
                }
              }}
              onCategoryUpdated={async () => {
                try {
                  const { categories: cats } = await api.getCategories();
                  setCategories(cats);
                } catch (error) {
                  console.error("Failed to refresh categories:", error);
                }
              }}
              onCategoryDeleted={async () => {
                try {
                  const { categories: cats } = await api.getCategories();
                  setCategories(cats);
                } catch (error) {
                  console.error("Failed to refresh categories:", error);
                }
              }}
            />
          </div>

          {/* Category Tabs for filtering */}
          {categories.length > 0 && (
            <div className="mb-6">
              <div className="alert alert-info mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>💡 <strong>Tip:</strong> Drag and drop URL cards onto category tabs to organize them!</span>
              </div>
              <CategoryTabs
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                totalURLCount={urlsState.data.length}
                onDrop={handleDropOnCategory}
              />
            </div>
          )}

          {urlsState.error && (
            <div className="alert alert-error mb-6">
              <span>{urlsState.error}</span>
            </div>
          )}

          {urlsState.loading ? (
            <div className="flex justify-center py-10">
              <div className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : urlsState.data.length > 0 ? (
            <div className="space-y-4">
              {urlsState.data.map((url) => (
                <URLCard key={url.shortCode} url={url} onEdit={handleEdit} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
            </div>
          ) : (
            <div className="card bg-base-100/80 backdrop-blur-xl border border-dashed border-base-300 shadow-inner animate-fade-in-up">
              <div className="card-body items-center text-center gap-4">
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary-content w-24 rounded-full">
                    <span className="text-4xl">✨</span>
                  </div>
                </div>
                <h3 className="card-title text-2xl">No links yet—let's craft one!</h3>
                <p className="text-base-content/70 max-w-sm">
                  Your beautiful dashboard is waiting. Paste a URL above to generate a shortened link with analytics and smart styling.
                </p>
                <div className="badge badge-outline badge-lg">Tip: explore theme accents for unique vibes</div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-10 mt-20">
        <div className="footer footer-center bg-base-100/80 backdrop-blur-xl border-t border-base-300/40 py-10 px-4 text-base-content">
          <aside>
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span className="text-3xl">🛠️</span>
              <span>Crafted with Deno, React, Tailwind, and DaisyUI</span>
            </div>
            <p className="text-base-content/70 max-w-xl">
              Built for creators who love delightful details. Open source, production-ready, and tuned for rapid experimentation.
            </p>
          </aside>
          <nav className="grid grid-flow-col gap-6 text-sm">
            <a className="link link-hover">Documentation</a>
            <a className="link link-hover">API Reference</a>
            <a className="link link-hover">Changelog</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
