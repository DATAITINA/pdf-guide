import { env } from "@/lib/env.server";
import type { StoreSettings } from "./types";
import { formatMoney } from "./money";

export function emailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") && env("RESEND_FROM_EMAIL"));
}

async function sendResend(input: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = env("RESEND_API_KEY");
  const from = env("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return false;
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
        subject: input.subject,
        html: input.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function wrapEmail(body: string): string {
  return [
    '<!doctype html><html><body style="margin:0;background:#F4F0E8;font-family:Georgia,serif;color:#1C1916;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E8;padding:32px 16px;"><tr><td align="center">',
    '<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;padding:36px 32px;border:1px solid #e6e0d4;"><tr><td>',
    body,
    "</td></tr></table></td></tr></table></body></html>",
  ].join("");
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
  const store = input.settings.storeName;
  const html = wrapEmail(
    [
      `<p style="margin:0 0 8px;letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#1A4D47;">${escapeHtml(store)}</p>`,
      '<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;">Your PDF guide is ready</h1>',
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Hello ${escapeHtml(input.name)},</p>`,
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Payment for <strong>${escapeHtml(input.productTitle)}</strong> (${escapeHtml(formatMoney(input.amountKobo, input.currency))}) is confirmed. Reference: ${escapeHtml(input.reference)}.</p>`,
      `<p style="margin:24px 0;"><a href="${escapeHtml(input.downloadUrl)}" style="display:inline-block;background:#1A4D47;color:#F4F0E8;text-decoration:none;padding:12px 22px;font-size:15px;">Download your guide</a></p>`,
      `<p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#5c574f;">If the button does not work, copy this link:<br/>${escapeHtml(input.downloadUrl)}</p>`,
      `<p style="margin:24px 0 0;font-size:14px;color:#5c574f;">Need help? Write to ${escapeHtml(input.settings.supportEmail)}.</p>`,
    ].join(""),
  );
  return sendResend({ to: input.to, subject: "Your PDF Guide Is Ready", html });
}

export async function sendWaitlistConfirmEmail(input: {
  to: string;
  topicName: string;
  code: string;
  position: number;
}): Promise<boolean> {
  const html = wrapEmail(
    [
      `<p style="margin:0 0 8px;letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#1A4D47;">Cairn</p>`,
      '<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;">You\'re on the list</h1>',
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Thanks for requesting <strong>${escapeHtml(input.topicName)}</strong>.</p>`,
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">You're <strong>#${input.position}</strong> for this topic. When the guide launches, your voucher activates for ₦1,500 instead of ₦2,000.</p>`,
      `<p style="margin:0 0 8px;font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#5c574f;">Your code</p>`,
      `<p style="margin:0 0 16px;font-size:22px;letter-spacing:.08em;font-family:ui-monospace,monospace;">${escapeHtml(input.code)}</p>`,
      `<p style="margin:0;font-size:14px;line-height:1.55;color:#5c574f;">This code stays reserved until the guide is published. We'll email you the moment it's live.</p>`,
    ].join(""),
  );
  return sendResend({
    to: input.to,
    subject: `You're on the list — ${input.topicName}`,
    html,
  });
}

export async function sendWaitlistLaunchEmail(input: {
  to: string;
  topicName: string;
  productTitle: string;
  code: string;
  expiresInDays: number;
  checkoutUrl: string;
}): Promise<boolean> {
  const html = wrapEmail(
    [
      `<p style="margin:0 0 8px;letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#1A4D47;">Cairn</p>`,
      '<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;">Your guide is live</h1>',
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;"><strong>${escapeHtml(input.productTitle)}</strong> is ready — the topic you asked for.</p>`,
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Use code <strong>${escapeHtml(input.code)}</strong> at checkout for ₦500 off. It expires in ${input.expiresInDays} days.</p>`,
      `<p style="margin:24px 0;"><a href="${escapeHtml(input.checkoutUrl)}" style="display:inline-block;background:#1A4D47;color:#F4F0E8;text-decoration:none;padding:12px 22px;font-size:15px;">Buy with your code</a></p>`,
      `<p style="margin:0;font-size:14px;line-height:1.55;color:#5c574f;">One use only. For this guide only.</p>`,
    ].join(""),
  );
  return sendResend({
    to: input.to,
    subject: `${input.productTitle} is live — your voucher is ready`,
    html,
  });
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
