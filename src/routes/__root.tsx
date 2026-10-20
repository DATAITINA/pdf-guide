import { useEffect } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { inject, pageview } from "@vercel/analytics";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Cairn";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1A4D47" },
      {
        name: "description",
        content:
          "Tell us your problem. Get a practical guide made for you. Clear digital guides for everyday life.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/cairn-mark.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      // Self-hosted fonts (see styles.css). Preload the heading font so the headline settles fast.
      {
        rel: "preload",
        href: "/fonts/fraunces-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/figtree-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <RouteAnalytics />
        <Scripts />
      </body>
    </html>
  ),
});

/**
 * Vercel Web Analytics, fed by the router so in-app navigation counts, exactly once per page.
 * (The script alone only sees full page loads; the library's <Analytics route> component sends
 * the first page twice.) Page views only on the free plan: the reader records the lock, and
 * the /out pages record unlock clicks, as page views.
 */
function RouteAnalytics() {
  const key = useRouterState({
    select: (s) => {
      // Path and template from the same match: `location` and `matches` update at different
      // moments, and mixing them logs each navigation twice.
      const last = s.matches[s.matches.length - 1];
      const path = trimSlash(last?.pathname ?? s.location.pathname);
      // "/read/$slug/$issue" -> "/read/[slug]/[issue]" so pages group by template in the dashboard.
      const route = trimSlash((last?.fullPath ?? path).replace(/\$(\w+)/g, "[$1]"));
      return `${route}|${path}`;
    },
  });
  useEffect(() => {
    inject({ framework: "tanstack-start", disableAutoTrack: true });
  }, []);
  useEffect(() => {
    // A re-mount (hydration, hot reload) must not count the same page again.
    if (key === lastPageview) return;
    lastPageview = key;
    const [route, path] = key.split("|");
    pageview({ route, path });
  }, [key]);
  return null;
}

let lastPageview = "";

/** "/stories/" -> "/stories", but "/" stays "/". */
const trimSlash = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);
