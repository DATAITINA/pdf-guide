import { createFileRoute } from "@tanstack/react-router";
import { loadAuthorizedPdf } from "@/lib/store/downloads";

export const Route = createFileRoute("/api/files/download/$token")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const result = await loadAuthorizedPdf(params.token, request);
        if ("error" in result) {
          return Response.json({ error: result.error }, { status: result.status });
        }
        return new Response(new Uint8Array(result.data), {
          headers: {
            "Content-Type": result.mime,
            "Content-Disposition": `attachment; filename="${result.filename.replace(/"/g, "")}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
