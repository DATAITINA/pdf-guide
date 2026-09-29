import { env } from "@/lib/env.server";
import type { StoreSettings } from "./types";
import { formatMoney } from "./money";

export function emailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") && env("RESEND_FROM_EMAIL"));
}

export async function sendPurchaseEmail(input: {
  settings: StoreSettings;
  to: string;
  name: string;
  productTitle: string;
  amountKobo: number;
  currency: string;
  reference: string;
  downloadUrl: string;
}): Promise<boolean> {
  const apiKey = env("RESEND_API_KEY");
  const from = env("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return false;

  const store = input.settings.storeName;
  const html = [
    "<!doctype html><html><body style=\"margin:0;background:#F4F0E8;font-family:Georgia,serif;color:#1C1916;\">",
    "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F4F0E8;padding:32px 16px;\"><tr><td align=\"center\">",
    "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#fff;padding:36px 32px;border:1px solid #e6e0d4;\"><tr><td>",
    `<p style="margin:0 0 8px;letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#1A4D47;">${escapeHtml(store)}</p>`,
    "<h1 style=\"margin:0 0 16px;font-size:26px;line-height:1.25;\">Your PDF guide is ready</h1>",
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Hello ${escapeHtml(input.name)},</p>`,
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Payment for <strong>${escapeHtml(input.productTitle)}</strong> (${escapeHtml(formatMoney(input.amountKobo, input.currency))}) is confirmed. Reference: ${escapeHtml(input.reference)}.</p>`,
    `<p style="margin:24px 0;"><a href="${escapeHtml(input.downloadUrl)}" style="display:inline-block;background:#1A4D47;color:#F4F0E8;text-decoration:none;padding:12px 22px;font-size:15px;">Download your guide</a></p>`,
    `<p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#5c574f;">If the button does not work, copy this link:<br/>${escapeHtml(input.downloadUrl)}</p>`,
    `<p style="margin:24px 0 0;font-size:14px;color:#5c574f;">Need help? Write to ${escapeHtml(input.settings.supportEmail)}.</p>`,
    "</td></tr></table></td></tr></table></body></html>",
  ].join("");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: "Your PDF Guide Is Ready",
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&" + "amp;";
    if (ch === "<") return "&" + "lt;";
    if (ch === ">") return "&" + "gt;";
    if (ch === '"') return "&" + "quot;";
    return "&#39;";
  });
}
