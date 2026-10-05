import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
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
      { rel: "preload", href: "/fonts/fraunces-latin.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: "/fonts/figtree-latin.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
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
          <Toaster position="top-center" richColors={false} />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
