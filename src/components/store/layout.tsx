import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import type { StoreSettings } from "@/lib/store/types";
import { Button } from "@/components/ui/button";
import { RequestGuideLink } from "./blocks";

const navLinks = [
  { to: "/guides" as const, label: "Ready-made guides" },
  { to: "/about" as const, label: "About" },
  { to: "/faq" as const, label: "FAQ" },
  { to: "/contact" as const, label: "Contact" },
];

function Brand({ settings, onClick }: { settings: StoreSettings; onClick?: () => void }) {
  return (
    <Link
      to="/"
      aria-label={`${settings.storeName} home`}
      className="flex min-h-12 min-w-0 items-center gap-3 rounded-md"
      onClick={onClick}
    >
      <img src="/cairn-mark.svg" alt="" aria-hidden="true" width={36} height={36} className="size-9 shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-display text-2xl leading-none text-ink">{settings.storeName}</span>
        <span className="mt-1 hidden text-xs leading-none font-medium text-muted md:block">
          Small steps, clearly marked
        </span>
      </span>
    </Link>
  );
}

export function StoreHeader({ settings }: { settings: StoreSettings }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-md">
      <div className="page flex h-16 items-center justify-between gap-3">
        <Brand settings={settings} onClick={close} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-12 items-center rounded-md px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
              activeProps={{ className: "text-accent" }}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2">
            <RequestGuideLink>Request a guide</RequestGuideLink>
          </Button>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <Button asChild size="sm" className="px-3.5">
            <RequestGuideLink>
              <span onClick={close}>Request a guide</span>
            </RequestGuideLink>
          </Button>
          <button
            type="button"
            className="grid size-12 place-items-center rounded-md text-ink transition-colors hover:bg-paper-2"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" className="animate-fade-in border-t border-line bg-paper lg:hidden" aria-label="Main">
          <ul className="page flex flex-col py-2">
            <li>
              <Link to="/" className="flex min-h-14 items-center text-lg font-medium" onClick={close}>
                Home
              </Link>
            </li>
            {navLinks.map((link) => (
              <li key={link.to} className="border-t border-line/70">
                <Link to={link.to} className="flex min-h-14 items-center text-lg font-medium" onClick={close}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

const footerLink = "inline-flex min-h-12 items-center text-base text-ink transition-colors hover:text-accent";

export function StoreFooter({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-paper-2/60" data-sticky-hide>
      <div className="page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div>
          <div className="flex items-center gap-3">
            <img src="/cairn-mark.svg" alt="" aria-hidden="true" width={32} height={32} className="size-8 shrink-0" />
            <p className="font-display text-2xl text-ink">{settings.storeName}</p>
          </div>
          <p className="mt-4 max-w-sm text-muted">
            Practical guides for home and work. Ask for one made for you, with check-ins on WhatsApp, or buy one
            that’s already written.
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <RequestGuideLink>Request a personal guide</RequestGuideLink>
          </Button>
        </div>
        <div>
          <p className="eyebrow text-subtle">Explore</p>
          <ul className="mt-2">
            <li>
              <Link to="/guides" className={footerLink}>
                Ready-made guides
              </Link>
            </li>
            <li>
              <Link to="/about" className={footerLink}>
                About
              </Link>
            </li>
            <li>
              <Link to="/faq" className={footerLink}>
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/contact" className={footerLink}>
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-subtle">Policies</p>
          <ul className="mt-2">
            <li>
              <Link to="/refund" className={footerLink}>
                Refund policy
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={footerLink}>
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={footerLink}>
                Terms
              </Link>
            </li>
            <li>
              <Link to="/admin" className={footerLink}>
                Publisher
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/80">
        <div className="page flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 text-sm text-muted">
          <p>
            © {year} {settings.storeName}. Small steps, clearly marked.
          </p>
          <UserButton />
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ settings, children }: { settings: StoreSettings; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-3 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <StoreHeader settings={settings} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <StoreFooter settings={settings} />
    </div>
  );
}
