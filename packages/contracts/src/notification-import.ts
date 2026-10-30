export type NotificationDraft = {
  blocked?: true;
  amount_minor?: string;
  occurred_on?: string;
  note?: string;
};

function date(year: number, month: number, day: number) {
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 &&
    value.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : undefined;
}

export function notificationDraft(message: string): NotificationDraft {
  const blocked =
    /\bstatus(?:\s+transaksi)?\s*[:=-]?\s*(?:gagal|failed|pending|dibatalkan|batal|cancelled|canceled|kedaluwarsa|expired)\b/i.test(
      message,
    ) ||
    /\b(?:transaksi|pembayaran|transfer)\s+(?:anda\s+)?(?:gagal|failed|pending|dibatalkan|batal|cancelled|canceled|kedaluwarsa|expired)\b/i.test(
      message,
    ) ||
    /\b(?:refund|pengembalian\s+dana)\b/i.test(message);
  if (blocked) return { blocked: true };
  const amounts = [
    ...message.matchAll(
      /\b(?:rp|idr)\s*\.?\s*(\d{1,3}(?:[.\s]\d{3})+|\d+)\b/gi,
    ),
  ].map((match) => match[1].replace(/\D/g, ""));
  const uniqueAmounts = [...new Set(amounts)];
  const ymd = message.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  const dmy = message.match(/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/);
  const merchant = message.match(
    /(?:merchant|nama\s+toko|toko)\s*[:=-]\s*([^\r\n]+)/i,
  )?.[1];
  const occurred_on = ymd
    ? date(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]))
    : dmy
      ? date(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]))
      : undefined;
  const note = merchant?.replace(/\s+/g, " ").trim().slice(0, 120);
  return {
    ...(uniqueAmounts.length === 1 ? { amount_minor: uniqueAmounts[0] } : {}),
    ...(occurred_on ? { occurred_on } : {}),
    ...(note ? { note } : {}),
  };
}
