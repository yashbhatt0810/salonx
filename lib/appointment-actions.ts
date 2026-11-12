"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getMe, requireBooker } from "./auth";
import { getSettings } from "./settings";
import { freeSlots, isFree, toMin } from "./booking";
import { today } from "./utils";

export type ApptInput = {
  id?: number | null;
  customerId?: number | null;
  customerName: string;
  phone: string | null;
  consent?: boolean;
  employeeId: number | null; // null = any available stylist
  seatId?: number | null;
  date: string;
  time: string; // HH:MM
  serviceIds: number[];
  notes?: string | null;
  source?: "counter" | "phone" | "online";
};

type Result = { ok: true; id: number; employeeName: string | null; time: string } | { ok: false; error: string };

const cleanPhone = (p: string | null | undefined) => {
  const d = (p ?? "").replace(/\D/g, "");
  if (!d) return null;
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
};

async function save(input: ApptInput, createdBy: string): Promise<Result> {
  const sql = db();
  const name = input.customerName?.trim();
  const phone = cleanPhone(input.phone);
  if (!name) return { ok: false, error: "Customer name is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "Pick a date" };
  if (!/^\d{2}:\d{2}$/.test(input.time)) return { ok: false, error: "Pick a time" };
  if (!input.serviceIds?.length) return { ok: false, error: "Select at least one service" };

  const services = await sql`SELECT id, name, price, coalesce(duration_min, 30) AS duration_min FROM services WHERE id IN ${sql(input.serviceIds)} AND active`;
  if (services.length === 0) return { ok: false, error: "Selected services are not available" };
  const st = await getSettings();
  const duration = Math.max(st.slot_minutes, services.reduce((a, s) => a + Number(s.duration_min), 0));
  if (toMin(input.time) < toMin(st.open_time) || toMin(input.time) + duration > toMin(st.close_time))
    return { ok: false, error: `Salon timing is ${st.open_time}–${st.close_time}` };

  try {
    const out = await sql.begin(async (tx) => {
      // Serialise bookings for the same day so two people can't grab the same slot.
      await tx`SELECT pg_advisory_xact_lock(hashtext(${"appt:" + input.date}))`;

      let employeeId = input.employeeId;
      if (!employeeId) {
        const free = await freeSlots(input.date, duration, { excludeId: input.id ?? undefined });
        const pick = free.stylists.find((s) => free.slots[s.id]?.includes(input.time));
        if (!pick) throw new Error("No stylist is free at this time — pick another slot");
        employeeId = pick.id;
      } else if (!(await isFree(input.date, employeeId, input.time, duration, input.id ?? undefined))) {
        throw new Error("This stylist is already booked at that time — pick another slot");
      }

      let customerId = input.customerId ?? null;
      if (!customerId && phone) {
        const found = await tx`SELECT id FROM customers WHERE phone = ${phone}`;
        if (found.length) customerId = found[0].id;
      }
      if (!customerId) {
        const consent = Boolean(input.consent);
        const [c] = await tx`INSERT INTO customers (name, phone, whatsapp_consent, consent_at)
          VALUES (${name}, ${phone}, ${consent}, ${consent ? new Date() : null}) RETURNING id`;
        customerId = c.id;
      } else if (input.consent) {
        await tx`UPDATE customers SET whatsapp_consent = TRUE, consent_at = coalesce(consent_at, now()) WHERE id = ${customerId}`;
      }

      const row = {
        customer_id: customerId, customer_name: name, phone, employee_id: employeeId, seat_id: input.seatId ?? null,
        date: input.date, start_time: input.time, duration_min: duration, notes: input.notes?.trim() || null,
      };
      let id: number;
      if (input.id) {
        await tx`UPDATE appointments SET ${tx(row)} WHERE id = ${input.id}`;
        await tx`DELETE FROM appointment_services WHERE appointment_id = ${input.id}`;
        id = input.id;
      } else {
        const [a] = await tx`INSERT INTO appointments ${tx({ ...row, source: input.source ?? "counter", created_by: createdBy })} RETURNING id`;
        id = a.id;
      }
      for (const s of services) {
        await tx`INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration_min)
          VALUES (${id}, ${s.id}, ${s.name}, ${s.price}, ${s.duration_min})`;
      }
      const [emp] = await tx`SELECT name FROM employees WHERE id = ${employeeId}`;
      return { id, employeeName: (emp?.name as string) ?? null };
    });
    revalidatePath("/appointments");
    revalidatePath("/");
    revalidatePath("/me");
    return { ok: true, id: out.id, employeeName: out.employeeName, time: input.time };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save booking" };
  }
}

/** Counter / phone booking by owner or manager. */
export async function saveAppointment(input: ApptInput): Promise<Result> {
  const me = await requireBooker();
  return save({ ...input, source: input.source === "phone" ? "phone" : "counter" }, me.name);
}

/** Public online booking from /book. */
export async function publicBook(input: ApptInput): Promise<Result> {
  const st = await getSettings();
  if (!st.booking_enabled) return { ok: false, error: "Online booking is closed right now. Please call the salon." };
  const t = today();
  const max = new Date(`${t}T00:00:00`);
  max.setDate(max.getDate() + st.booking_days);
  if (input.date < t || new Date(`${input.date}T00:00:00`) > max) return { ok: false, error: "Please pick a date within the booking window" };
  const phone = cleanPhone(input.phone);
  if (!phone || phone.length !== 10) return { ok: false, error: "Enter a valid 10-digit mobile number" };
  if (!input.customerName?.trim() || input.customerName.trim().length > 80) return { ok: false, error: "Enter your name" };
  // Never let the public form touch existing records by id.
  return save({ ...input, id: null, customerId: null, seatId: null, notes: input.notes?.slice(0, 300) ?? null, source: "online" }, "Online");
}

const ALLOWED = ["booked", "arrived", "in_service", "completed", "cancelled", "no_show"];

export async function setAppointmentStatus(f: FormData) {
  const me = await getMe();
  if (!me) throw new Error("Not signed in");
  const id = Number(f.get("id"));
  const status = String(f.get("status"));
  if (!id || !ALLOWED.includes(status)) throw new Error("Invalid");
  if (me.role === "barber" && !me.canBook) {
    const [a] = await db()`SELECT employee_id FROM appointments WHERE id = ${id}`;
    if (!a || a.employee_id !== me.employeeId || status === "cancelled") throw new Error("Not allowed");
  }
  await db()`UPDATE appointments SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${id}`);
  revalidatePath("/");
  revalidatePath("/me");
}
