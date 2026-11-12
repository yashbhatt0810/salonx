import { db } from "./db";
import { getSettings } from "./settings";
import { TZ, today } from "./utils";

export const ACTIVE_STATUSES = ["booked", "arrived", "in_service", "completed"] as const;

export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  booked: { label: "Booked", cls: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  arrived: { label: "Arrived", cls: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  in_service: { label: "In service", cls: "bg-violet-50 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", cls: "bg-black/[0.03] text-black/40 border-black/10 line-through", dot: "bg-black/30" },
  no_show: { label: "No show", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

export const STYLIST_COLORS = ["#b8862f", "#2f7cb8", "#2f9e6e", "#9b4fb8", "#c4513d", "#3d8fa6", "#7a6a2f", "#b84f86"];

export const toMin = (t: string) => {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const fmtTime = (t: string) => {
  const m = toMin(t);
  const h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function nowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  return toMin(parts);
}

export type Stylist = { id: number; name: string; designation: string | null; color: string; off: boolean };

/** Active stylists, with `off` = marked absent / week off on that date. */
export async function stylists(date: string): Promise<Stylist[]> {
  const rows = await db()`
    SELECT e.id, e.name, e.designation, a.status AS att FROM employees e
    LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ${date}
    WHERE e.active AND e.is_stylist ORDER BY e.id`;
  return rows.map((r) => ({
    id: r.id, name: r.name, designation: r.designation,
    color: STYLIST_COLORS[(r.id - 1) % STYLIST_COLORS.length],
    off: r.att === "A" || r.att === "W",
  }));
}

type Busy = { employee_id: number; start: number; end: number };

async function busyBlocks(date: string, excludeId?: number): Promise<Busy[]> {
  const rows = await db()`
    SELECT employee_id, start_time::text AS st, duration_min FROM appointments
    WHERE date = ${date} AND status IN ('booked','arrived','in_service','completed')
      AND employee_id IS NOT NULL ${excludeId ? db()`AND id <> ${excludeId}` : db()``}`;
  return rows.map((r) => ({ employee_id: r.employee_id, start: toMin(r.st), end: toMin(r.st) + Number(r.duration_min) }));
}

/** Free start times for each stylist on a date for a job of `duration` minutes. */
export async function freeSlots(date: string, duration: number, opts: { employeeId?: number | null; excludeId?: number } = {}) {
  const st = await getSettings();
  const open = toMin(st.open_time);
  const close = toMin(st.close_time);
  const step = st.slot_minutes;
  const list = (await stylists(date)).filter((s) => !s.off && (!opts.employeeId || s.id === opts.employeeId));
  const busy = await busyBlocks(date, opts.excludeId);
  const earliest = date === today() ? Math.ceil((nowMinutes() + 10) / step) * step : 0;

  const result: Record<number, string[]> = {};
  for (const s of list) {
    const mine = busy.filter((b) => b.employee_id === s.id);
    const slots: string[] = [];
    for (let t = open; t + duration <= close; t += step) {
      if (t < earliest) continue;
      if (mine.some((b) => t < b.end && t + duration > b.start)) continue;
      slots.push(fromMin(t));
    }
    result[s.id] = slots;
  }
  return { stylists: list, slots: result, open: st.open_time, close: st.close_time, step };
}

/** True if the stylist is free for the given window (ignores appointment `excludeId`). */
export async function isFree(date: string, employeeId: number, start: string, duration: number, excludeId?: number) {
  const s = toMin(start);
  const busy = (await busyBlocks(date, excludeId)).filter((b) => b.employee_id === employeeId);
  return !busy.some((b) => s < b.end && s + duration > b.start);
}
