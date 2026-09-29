import { createFileRoute } from "@tanstack/react-router";
import { processPaystackWebhook } from "@/lib/store/payments";

export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-paystack-signature");
        try {
          await processPaystackWebhook(raw, signature);
          return Response.json({ received: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Webhook error";
          const status = message.includes("signature") ? 401 : 400;
          return Response.json({ error: "Invalid webhook" }, { status });
        }
      },
    },
  },
});
