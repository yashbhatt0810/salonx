import { db } from "@/lib/db";
import { Armchair, Plus, Power } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { addSeat, deleteSeat, toggleSeat } from "@/lib/actions";
import { Card, Empty, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { AutoRefresh } from "@/components/AutoRefresh";
import { FloorPlan } from "@/components/floor/FloorPlan";
import type { MapItem, MapSeat } from "@/components/floor/types";
import { inr, today } from "@/lib/utils";

export default async function Seats() {
  const me = await requireAdmin();
  const sql = db();
  const t = today();
  const [seats, items, settings, busy] = await Promise.all([
    sql`SELECT s.*, coalesce((SELECT sum(total) FROM visits WHERE seat_id = s.id AND visit_date = ${t}),0) AS today_sale,
      (SELECT count(*)::int FROM visits WHERE seat_id = s.id AND visit_date = ${t}) AS today_bills
      FROM seats s ORDER BY s.id`,
    sql`SELECT * FROM floor_items ORDER BY id`,
    sql`SELECT key, value FROM settings WHERE key IN ('floor_w','floor_d')`,
    sql`SELECT a.seat_id, a.customer_name, e.name AS stylist FROM appointments a LEFT JOIN employees e ON e.id = a.employee_id
        WHERE a.date = ${t} AND a.status = 'in_service' AND a.seat_id IS NOT NULL`,
  ]);
  const cfg = Object.fromEntries(settings.map((r) => [r.key, Number(r.value)]));
  const width = cfg.floor_w || Math.max(6, Math.ceil(seats.length * 1.4 + 2));
  const depth = cfg.floor_d || 7;

  // Seats never placed on the map get a default row along the back wall.
  let auto = 0;
  const perRow = Math.max(1, Math.floor((width - 1) / 1.4));
  const mapSeats: MapSeat[] = seats.map((s) => {
    let x = s.pos_x as number | null;
    let y = s.pos_y as number | null;
    if (x == null || y == null) {
      const row = Math.floor(auto / perRow);
      x = 1 + (auto % perRow) * 1.4;
      y = depth - 1.3 - row * 2.2;
      auto++;
    }
    const b = busy.find((r) => r.seat_id === s.id);
    return {
      id: s.id, name: s.name, active: s.active, x, y, rot: s.rot ?? 0, kind: s.kind ?? "chair",
      status: !s.active ? "off" : b ? "busy" : "free",
      who: b ? `${b.customer_name}${b.stylist ? ` with ${b.stylist}` : ""}` : null,
      bills: s.today_bills, sale: Number(s.today_sale),
    };
  });
  const mapItems: MapItem[] = items.length
    ? items.map((i) => ({ key: `i${i.id}`, id: i.id, kind: i.kind, label: i.label, x: i.pos_x, y: i.pos_y, rot: i.rot }))
    : [
        // A starter layout so the map isn't empty; drag or delete in Edit layout.
        { key: "d1", id: null, kind: "door", label: null, x: Math.min(width - 1, 1.2), y: 0.1, rot: 0 },
        { key: "d2", id: null, kind: "reception", label: null, x: Math.max(1.5, width - 1.6), y: 1.2, rot: 180 },
        { key: "d3", id: null, kind: "sofa", label: null, x: Math.min(width / 2, width - 2), y: 0.8, rot: 180 },
      ];

  return (
    <>
      <PageHeader icon="seats" title="Seats" sub={`${seats.filter((s) => s.active).length} active seats · salon map`} action={<AutoRefresh seconds={30} />} />

      <Card icon="seats" title="Salon map" className="mb-4">
        {seats.length === 0 ? <Empty>Add a seat below to see it on the map.</Empty> : (
          <FloorPlan width={width} depth={depth} seats={JSON.parse(JSON.stringify(mapSeats))} items={JSON.parse(JSON.stringify(mapItems))} canEdit={me.role !== "barber"} />
        )}
      </Card>

      <Card className="mb-4 max-w-xl">
        <form action={addSeat} className="flex gap-2">
          <input className="input" name="name" placeholder="Seat name, e.g. Seat 4 / Spa Chair" required />
          <button className="btn-primary whitespace-nowrap"><Plus size={14} /> Add seat</button>
        </form>
      </Card>
      {seats.length === 0 ? <Card><Empty>No seats yet.</Empty></Card> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {mapSeats.map((s) => (
            <div key={s.id} className={`card p-4 ${s.active ? "" : "opacity-55"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.active ? "bg-ink text-brass" : "bg-black/5 text-black/40"}`}><Armchair size={24} strokeWidth={1.7} /></span>
                  <div className="font-display text-lg font-semibold">{s.name}</div>
                </div>
                <span className={`pill ${s.status === "busy" ? "bg-violet-50 text-violet-700" : s.active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/50"}`}>
                  {s.status === "busy" ? "In service" : s.active ? "Active" : "Off"}
                </span>
              </div>
              {s.who && <div className="mt-2 truncate text-xs text-violet-700">{s.who}</div>}
              <div className="num mt-2 text-sm text-black/60">Today: {s.bills} bills · {inr(s.sale)}</div>
              <div className="mt-3 flex gap-1">
                <form action={toggleSeat}><input type="hidden" name="id" value={s.id} /><button className="btn-ghost btn-sm"><Power size={13} /> {s.active ? "Turn off" : "Turn on"}</button></form>
                <form action={deleteSeat}><input type="hidden" name="id" value={s.id} /><ConfirmSubmit message="Remove this seat?">Remove</ConfirmSubmit></form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
