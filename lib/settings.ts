import { db } from "./db";

export type Settings = {
  salon_name: string;
  salon_address: string;
  salon_phone: string;
  bill_footer: string;
  reminder_days: number;
  contact_email: string;
  owner_name: string;
  city: string;
};

export async function getSettings(): Promise<Settings> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = (await db()`SELECT key, value FROM settings`) as unknown as { key: string; value: string }[];
  } catch {
    rows = [];
  }
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    salon_name: m.salon_name || process.env.SALON_NAME || "SalonX",
    salon_address: m.salon_address || "",
    salon_phone: m.salon_phone || "",
    bill_footer: m.bill_footer || "Thank you! Visit again.",
    reminder_days: Number(m.reminder_days || 30),
    contact_email: m.contact_email || "",
    owner_name: m.owner_name || "",
    city: m.city || "Rajkot, Gujarat",
  };
}
