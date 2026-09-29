import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { mapSettings } from "./map";
import { DEFAULT_SETTINGS, ORDER_STATUS } from "./types";

export const getDownloadPage = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { emailConfigured } = await import("./email.server");
    const sql = await getSql();
    const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
    const settings = settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
    const rows = await sql.query<{
      token_id: string;
      order_id: string;
      product_id: string;
      expires_at: string | null;
      download_count: number;
      max_downloads: number;
      status: string;
      customer_email: string;
      customer_name: string;
      payment_reference: string;
      title: string;
      cover_image: string;
      email_sent_at: string | null;
    }>(
      `select d.id as token_id, d.order_id, d.product_id, d.expires_at, d.download_count, d.max_downloads,
              o.status, o.customer_email, o.customer_name, o.payment_reference, o.email_sent_at,
              p.title, p.cover_image
       from download_tokens d
       join orders o on o.id = d.order_id
       join products p on p.id = d.product_id
       where d.token = $1
       limit 1`,
      [data.token],
    );
    const row = rows[0];
    if (!row || row.status !== ORDER_STATUS.paid) {
      return { settings, access: null as null, emailed: false };
    }
    const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
    const exhausted = Number(row.download_count) >= Number(row.max_downloads);
    return {
      settings,
      emailed: Boolean(row.email_sent_at) && emailConfigured(),
      access: {
        title: row.title,
        coverImage: row.cover_image,
        email: row.customer_email,
        name: row.customer_name,
        reference: row.payment_reference,
        expired,
        exhausted,
        remaining: Math.max(0, Number(row.max_downloads) - Number(row.download_count)),
        filePath: `/api/files/download/${data.token}`,
      },
    };
  });
