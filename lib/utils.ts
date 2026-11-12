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

export const empCode = (id: number) => `EMP${String(id).padStart(3, "0")}`;

export function amountInWords(n: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? a[x] : `${b[Math.floor(x / 10)]}${x % 10 ? " " + a[x % 10] : ""}`);
  const three = (x: number) => `${x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : ""}${x % 100 ? two(x % 100) : ""}`;
  let v = Math.round(Math.abs(n));
  if (v === 0) return "Zero Rupees Only";
  const parts: string[] = [];
  const crore = Math.floor(v / 10000000); v %= 10000000;
  const lakh = Math.floor(v / 100000); v %= 100000;
  const thousand = Math.floor(v / 1000); v %= 1000;
  if (crore) parts.push(`${two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (v) parts.push(three(v));
  return `${parts.join(" ")} Rupees Only`;
}
