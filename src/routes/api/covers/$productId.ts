import { createFileRoute } from "@tanstack/react-router";
import { loadProductCover } from "@/lib/store/downloads";

export const Route = createFileRoute("/api/covers/$productId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const cover = await loadProductCover(params.productId);
        if (!cover) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(cover.data), {
          headers: {
            "Content-Type": cover.mime,
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
