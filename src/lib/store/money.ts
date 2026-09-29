export function formatMoney(kobo: number, currency = "NGN"): string {
  const amount = (Number(kobo) || 0) / 100;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `₦${amount.toLocaleString("en-NG")}`;
  }
}

export function nairaToKobo(naira: number): number {
  return Math.round(Number(naira) * 100);
}

export function koboToNaira(kobo: number): number {
  return (Number(kobo) || 0) / 100;
}
