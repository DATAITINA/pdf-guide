import { getSql } from "@/lib/db";
import { hashValue, newId } from "./ids";
import { ORDER_STATUS } from "./types";

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === "string") return Buffer.from(data, "base64");
  throw new Error("File is missing.");
}

export async function loadAuthorizedPdf(token: string, request: Request) {
  const sql = await getSql();
  const rows = await sql.query<{
    token_id: string;
    order_id: string;
    product_id: string;
    expires_at: string | null;
    download_count: number;
    max_downloads: number;
    status: string;
    filename: string;
    mime: string;
    data: unknown;
  }>(
    `select d.id as token_id, d.order_id, d.product_id, d.expires_at, d.download_count, d.max_downloads,
            o.status, f.filename, f.mime, f.data
     from download_tokens d
     join orders o on o.id = d.order_id
     join product_files f on f.product_id = d.product_id
     where d.token = $1
     limit 1`,
    [token],
  );
  const row = rows[0];
  if (!row || row.status !== ORDER_STATUS.paid) {
    return { error: "This download link is not valid.", status: 403 as const };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { error: "This download link has expired.", status: 410 as const };
  }
  if (Number(row.download_count) >= Number(row.max_downloads)) {
    return { error: "This download link has reached its limit.", status: 429 as const };
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const ua = request.headers.get("user-agent") || "";
  await sql`update download_tokens
    set download_count = download_count + 1, last_downloaded_at = now()
    where id = ${row.token_id}`;
  await sql`insert into download_events (id, token_id, order_id, product_id, ip_hash, user_agent)
    values (${newId("dl")}, ${row.token_id}, ${row.order_id}, ${row.product_id}, ${ip ? hashValue(ip) : null}, ${ua.slice(0, 180)})`;

  return {
    filename: row.filename,
    mime: row.mime || "application/pdf",
    data: toBuffer(row.data),
  };
}

export async function loadProductCover(productId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ mime: string; data: unknown }>(
    `select mime, data from product_covers where product_id = $1`,
    [productId],
  );
  if (!rows[0]) return null;
  return { mime: rows[0].mime, data: toBuffer(rows[0].data) };
}

export async function loadTransferProof(orderId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ mime: string; data: unknown; filename: string }>(
    `select mime, data, filename from transfer_proofs where order_id = $1`,
    [orderId],
  );
  if (!rows[0]) return null;
  return { mime: rows[0].mime, filename: rows[0].filename, data: toBuffer(rows[0].data) };
}
