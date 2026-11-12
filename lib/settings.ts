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
  open_time: string;
  close_time: string;
  slot_minutes: number;
  booking_enabled: boolean;
  booking_days: number;
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
    open_time: m.open_time || "09:00",
    close_time: m.close_time || "21:00",
    slot_minutes: Math.max(5, Number(m.slot_minutes || 15)),
    booking_enabled: (m.booking_enabled ?? "1") === "1",
    booking_days: Math.min(60, Math.max(1, Number(m.booking_days || 7))),
  };
}
