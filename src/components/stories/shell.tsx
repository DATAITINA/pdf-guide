import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Dark, cinematic frame for the story pages. The guide pages keep their own light PageShell. */
export function StoryShell({ children, bare }: { children: ReactNode; bare?: boolean }) {
  return (
    <div className="night flex min-h-dvh flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-3 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {bare ? null : <StoryHeader />}
      <main id="main" className="flex-1">
        {children}
      </main>
      {bare ? null : <StoryFooter />}
    </div>
  );
}

const navLink =
  "inline-flex min-h-12 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:text-ink";

function StoryHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/85 backdrop-blur-md">
      <div className="page flex h-14 items-center justify-between gap-3">
        <Link
          to="/"
          className="flex min-h-12 items-center gap-2 rounded-md"
          aria-label="Cairn home"
        >
          <span className="font-display text-2xl leading-none text-ink">Cairn</span>
          <span className="mt-1 size-1.5 rounded-full bg-accent" aria-hidden />
        </Link>
        <nav className="flex items-center" aria-label="Main">
          <Link to="/stories" className={navLink} activeProps={{ className: "text-ink" }}>
            Library
          </Link>
          <Link to="/guides" className={navLink}>
            Guides
          </Link>
        </nav>
      </div>
    </header>
  );
}

const footLink =
  "inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink";

function StoryFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-line/60">
      <div className="page grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl text-ink">Cairn</p>
          <p className="mt-2 text-muted">Stories that won’t let you go.</p>
        </div>
        <ul>
          <li>
            <Link to="/stories" className={footLink}>
              All stories
            </Link>
          </li>
          <li>
            <Link to="/guides" className={footLink}>
              Guides
            </Link>
          </li>
          <li>
            <Link to="/about" className={footLink}>
              About
            </Link>
          </li>
        </ul>
        <ul>
          <li>
            <Link to="/refund" className={footLink}>
              Refund policy
            </Link>
          </li>
          <li>
            <Link to="/privacy" className={footLink}>
              Privacy
            </Link>
          </li>
          <li>
            <Link to="/terms" className={footLink}>
              Terms
            </Link>
          </li>
        </ul>
      </div>
      <p className="page pb-8 text-xs text-subtle">© {year} Cairn.</p>
    </footer>
  );
}
