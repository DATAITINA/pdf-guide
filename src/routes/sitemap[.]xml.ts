import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { ensureSeeded } from "@/lib/store/seed";
import { env } from "@/lib/env.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureSeeded();
        const sql = await getSql();
        const products = await sql<{ slug: string }>`
          select slug from products where published = true and archived = false and is_placeholder = false`;
        const origin = env("APP_URL") || new URL(request.url).origin;
        const staticPaths = ["/", "/guides", "/about", "/contact", "/faq", "/refund", "/privacy", "/terms"];
        const urls = [
          ...staticPaths.map((path) => `${origin}${path}`),
          ...products.map((p) => `${origin}/guides/${p.slug}`),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
        return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
