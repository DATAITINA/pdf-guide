import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import type { StoreSettings } from "@/lib/store/types";

const navLinks = [
  { to: "/" as const, label: "Home" },
  { to: "/guides" as const, label: "Guides" },
  { to: "/about" as const, label: "About" },
  { to: "/faq" as const, label: "FAQ" },
];

export function StoreHeader({ settings }: { settings: StoreSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          aria-label={`${settings.storeName} home`}
          className="flex min-w-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <img src="/cairn-mark.svg" alt="" aria-hidden="true" className="size-10 shrink-0" />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-[1.4rem] tracking-[-0.045em]">
              {settings.storeName}
            </span>
            <span className="mt-1 text-[9px] font-semibold tracking-[0.16em] text-muted uppercase">
              Small steps, clearly marked
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-[10px] px-3 py-2 text-ink/90 transition-colors hover:bg-paper-2 hover:text-ink"
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/guides"
            search={{ q: "" }}
            className="rounded-[10px] px-3 py-2 text-ink/90 transition-colors hover:bg-paper-2"
            aria-label="Search guides"
          >
            <Search className="size-4" />
          </Link>
          <Link
            to="/guides"
            className="ml-1 rounded-[10px] bg-accent px-3.5 py-2 text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Explore
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/guides"
            className="grid size-12 place-items-center rounded-[12px] text-ink transition-colors hover:bg-paper-2"
            aria-label="Search guides"
          >
            <Search className="size-5" />
          </Link>
          <button
            type="button"
            className="grid size-12 place-items-center rounded-[12px] text-ink transition-colors hover:bg-paper-2"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-line bg-paper md:hidden"
          role="dialog"
          aria-label="Mobile navigation"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-[12px] px-4 py-3 text-base font-medium transition-colors hover:bg-paper-2"
                activeOptions={{ exact: link.to === "/" }}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/guides"
              className="mt-2 rounded-[12px] bg-accent px-4 py-3 text-center text-base font-medium text-accent-fg"
              onClick={() => setOpen(false)}
            >
              Explore guides
            </Link>
            <Link
              to="/contact"
              className="rounded-[12px] px-4 py-3 text-base text-muted transition-colors hover:bg-paper-2"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function StoreFooter({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-paper-2/60" data-sticky-hide>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/cairn-mark.svg" alt="" aria-hidden="true" className="size-11 shrink-0" />
            <p className="font-display text-2xl tracking-tight">{settings.storeName}</p>
          </div>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">{settings.tagline}</p>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
            Practical digital guides you can download and keep — written for ordinary days, not perfect ones.
          </p>
        </div>
        <div>
          <p className="text-[0.8125rem] font-semibold tracking-[0.16em] text-subtle uppercase">Explore</p>
          <ul className="mt-3 space-y-1 text-base">
            <li>
              <Link to="/" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li>
              <Link to="/guides" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                All guides
              </Link>
            </li>
            <li>
              <Link to="/about" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/faq" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[0.8125rem] font-semibold tracking-[0.16em] text-subtle uppercase">Policies</p>
          <ul className="mt-3 space-y-1 text-base">
            <li>
              <Link to="/refund" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                Refund policy
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                Terms
              </Link>
            </li>
            <li>
              <Link to="/admin" className="inline-flex min-h-11 items-center transition-colors hover:text-accent">
                Publisher
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:px-6">
          <p>
            © {year} {settings.storeName}. Small steps, clearly marked.
          </p>
          <UserButton />
        </div>
      </div>
    </footer>
  );
}

export function PageShell({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <StoreHeader settings={settings} />
      <main>{children}</main>
      <StoreFooter settings={settings} />
    </div>
  );
}
