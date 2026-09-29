import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import type { StoreSettings } from "@/lib/store/types";

export function StoreHeader({ settings }: { settings: StoreSettings }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label={`${settings.storeName} home`} className="flex min-w-0 items-center gap-2.5">
          <img src="/fieldnote-mark.svg" alt="" aria-hidden="true" className="size-10 shrink-0" />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-[1.4rem] tracking-[-0.045em]">{settings.storeName}</span>
            <span className="mt-1 text-[9px] font-semibold tracking-[0.16em] text-muted uppercase">Notes for real life</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/guides" className="hidden rounded-[10px] px-3 py-2 hover:bg-paper-2 sm:inline">
            Guides
          </Link>
          <Link to="/faq" className="hidden rounded-[10px] px-3 py-2 hover:bg-paper-2 sm:inline">
            FAQ
          </Link>
          <Link to="/guides" className="rounded-[10px] bg-accent px-3.5 py-2 text-accent-fg">
            Explore
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StoreFooter({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-paper-2/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/fieldnote-mark.svg" alt="" aria-hidden="true" className="size-11 shrink-0" />
            <p className="font-display text-2xl tracking-tight">{settings.storeName}</p>
          </div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{settings.tagline}</p>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] text-subtle uppercase">Store</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:underline">About</Link></li>
            <li><Link to="/guides" className="hover:underline">Guides</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            <li><Link to="/faq" className="hover:underline">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] text-subtle uppercase">Policies</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/refund" className="hover:underline">Refund policy</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms</Link></li>
            <li><Link to="/admin" className="hover:underline">Publisher</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:px-6">
          <p>© {year} {settings.storeName}. Digital guides for everyday life.</p>
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
      {children}
      <StoreFooter settings={settings} />
    </div>
  );
}
