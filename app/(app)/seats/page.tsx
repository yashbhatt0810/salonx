import { db } from "@/lib/db";
import { Armchair, Plus, Power } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { addSeat, deleteSeat, toggleSeat } from "@/lib/actions";
import { Card, Empty, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { inr, today } from "@/lib/utils";

export default async function Seats() {
  await requireAdmin();
  const sql = db();
  const seats = await sql`SELECT s.*, coalesce((SELECT sum(total) FROM visits WHERE seat_id = s.id AND visit_date = ${today()}),0) AS today_sale,
    (SELECT count(*)::int FROM visits WHERE seat_id = s.id AND visit_date = ${today()}) AS today_bills
    FROM seats s ORDER BY s.id`;
  return (
    <>
      <PageHeader icon="seats" title="Seats" sub={`${seats.filter((s) => s.active).length} active seats`} />
      <Card className="mb-4 max-w-xl">
        <form action={addSeat} className="flex gap-2">
          <input className="input" name="name" placeholder="Seat name, e.g. Seat 4 / Spa Chair" required />
          <button className="btn-primary whitespace-nowrap"><Plus size={14} /> Add seat</button>
        </form>
      </Card>
      {seats.length === 0 ? <Card><Empty>No seats yet.</Empty></Card> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {seats.map((s) => (
            <div key={s.id} className={`card p-4 ${s.active ? "" : "opacity-55"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.active ? "bg-ink text-brass" : "bg-black/5 text-black/40"}`}><Armchair size={24} strokeWidth={1.7} /></span>
                  <div className="font-display text-lg font-semibold">{s.name}</div>
                </div>
                <span className={`pill ${s.active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/50"}`}>{s.active ? "Active" : "Off"}</span>
              </div>
              <div className="num mt-2 text-sm text-black/60">Today: {s.today_bills} bills · {inr(s.today_sale)}</div>
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
