export function isNigerianWhatsapp(raw: string): boolean {
  const compact = raw.replace(/[\s()-]/g, "");
  return /^(?:0[789]\d{9}|\+234[789]\d{9})$/.test(compact);
}
