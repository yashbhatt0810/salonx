import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { freeSlots } from "@/lib/booking";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Public: free slots for a date. ?date=YYYY-MM-DD&services=1,2&stylist=3 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const date = q.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "bad date" }, { status: 400 });
  const ids = (q.get("services") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 10);
  const stylist = Number(q.get("stylist")) || null;
  const st = await getSettings();
  let duration = st.slot_minutes;
  if (ids.length) {
    const [r] = await db()`SELECT coalesce(sum(coalesce(duration_min,30)),0)::int AS d FROM services WHERE id IN ${db()(ids)} AND active`;
    duration = Math.max(st.slot_minutes, r.d);
  }
  const free = await freeSlots(date, duration, { employeeId: stylist });
  // "Any stylist" = union of every stylist's free times.
  const any = Array.from(new Set(Object.values(free.slots).flat())).sort();
  return NextResponse.json(
    { date, duration, stylists: free.stylists.map((s) => ({ id: s.id, name: s.name, slots: free.slots[s.id] ?? [] })), any },
    { headers: { "Cache-Control": "no-store" } },
  );
}
