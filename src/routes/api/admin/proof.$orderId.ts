import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { loadTransferProof } from "@/lib/store/downloads";

export const Route = createFileRoute("/api/admin/proof/$orderId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const user = await getSessionUser();
        if (!user) return new Response("Unauthorized", { status: 401 });
        const sql = await getSql();
        const admins = await sql<{ user_id: string }>`select user_id from store_admins`;
        if (admins.length && !admins.some((a) => a.user_id === user.id)) {
          return new Response("Forbidden", { status: 403 });
        }
        const proof = await loadTransferProof(params.orderId);
        if (!proof) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(proof.data), {
          headers: {
            "Content-Type": proof.mime,
            "Content-Disposition": `inline; filename="${proof.filename.replace(/"/g, "")}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
