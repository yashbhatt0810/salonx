export const TZ = "Asia/Kolkata";

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function thisMonth(): string {
  return today().slice(0, 7);
}

export function monthRange(month: string): { start: string; end: string; days: number } {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(days).padStart(2, "0")}`, days };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function inr(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysSince(d: string | null | undefined): number | null {
  if (!d) return null;
  const a = new Date(d.slice(0, 10) + "T00:00:00");
  const b = new Date(today() + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function waLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  let p = phone.replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export const PAYMENT_MODES = ["Cash", "UPI", "Card", "Credit"] as const;

export const ATT_LABEL: Record<string, string> = { P: "Present", H: "Half day", A: "Absent", W: "Week off" };

// Salary rule: P and W count as a full paid day, H as half, A as unpaid.
export function paidDays(counts: { P: number; H: number; A: number; W: number }) {
  return counts.P + counts.W + counts.H * 0.5;
}
