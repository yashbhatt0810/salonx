import Link from "next/link";
import { ArrowRight, BellRing, MessageCircle, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { fmtDate, inr, monthRange, thisMonth, today, waLink } from "@/lib/utils";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const sql = db();
  const t = today();
  const { start, end } = monthRange(thisMonth());
  const settings = await getSettings();

  const [[todayRev], [monthRev], [todayExp], [monthExp], [monthPur], [custCount]] = await Promise.all([
    sql`SELECT coalesce(sum(total),0) AS v, count(*)::int AS bills FROM visits WHERE visit_date = ${t}`,
    sql`SELECT coalesce(sum(total),0) AS v, count(*)::int AS bills FROM visits WHERE visit_date BETWEEN ${start} AND ${end}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM expenses WHERE date = ${t}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM expenses WHERE date BETWEEN ${start} AND ${end}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM purchases WHERE date BETWEEN ${start} AND ${end}`,
    sql`SELECT count(*)::int AS v FROM customers`,
  ]);

  const [byMode, byStaff, attendance, recent, lowStock, birthdays, dueBack] = await Promise.all([
    sql`SELECT payment_mode, coalesce(sum(total),0) AS v FROM visits WHERE visit_date = ${t} GROUP BY 1 ORDER BY 2 DESC`,
    sql`SELECT e.name, coalesce(sum(vi.price*vi.qty),0) AS v, count(*)::int AS n
        FROM visit_items vi JOIN visits v ON v.id = vi.visit_id JOIN employees e ON e.id = vi.employee_id
        WHERE v.visit_date = ${t} GROUP BY e.name ORDER BY 2 DESC`,
    sql`SELECT e.id, e.name, a.status FROM employees e LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ${t} WHERE e.active ORDER BY e.name`,
    sql`SELECT v.id, v.total, v.payment_mode, c.name AS customer, s.name AS seat,
          (SELECT string_agg(service_name, ', ') FROM visit_items WHERE visit_id = v.id) AS services
        FROM visits v LEFT JOIN customers c ON c.id = v.customer_id LEFT JOIN seats s ON s.id = v.seat_id
        WHERE v.visit_date = ${t} ORDER BY v.id DESC LIMIT 8`,
    sql`SELECT i.id, i.name, i.unit, i.min_stock,
          coalesce((SELECT sum(qty) FROM purchases WHERE item_id = i.id),0) - coalesce((SELECT sum(qty) FROM stock_usage WHERE item_id = i.id),0) AS stock
        FROM purchase_items i WHERE i.active AND i.min_stock > 0`,
    sql`SELECT id, name, phone, dob, anniversary, whatsapp_consent FROM customers
        WHERE (dob IS NOT NULL AND to_char(dob,'MM-DD') = to_char(${t}::date,'MM-DD'))
           OR (anniversary IS NOT NULL AND to_char(anniversary,'MM-DD') = to_char(${t}::date,'MM-DD'))`,
    sql`SELECT c.id, c.name, c.phone, c.whatsapp_consent, max(v.visit_date) AS last
        FROM customers c JOIN visits v ON v.customer_id = c.id
        GROUP BY c.id HAVING max(v.visit_date) BETWEEN (${t}::date - ${settings.reminder_days + 7}::int) AND (${t}::date - ${settings.reminder_days}::int)
        ORDER BY last LIMIT 10`,
  ]);

  const low = lowStock.filter((r) => Number(r.stock) <= Number(r.min_stock));
  const profit = Number(monthRev.v) - Number(monthExp.v) - Number(monthPur.v);
  const present = attendance.filter((a) => a.status === "P" || a.status === "H").length;

  return (
    <>
      <PageHeader
        title={`Hello, ${me.name.split(" ")[0]}`}
        sub={`${fmtDate(t)} · ${settings.salon_name}`}
        action={<Link href="/billing" className="btn-brass"><Plus size={15} /> New Bill</Link>}
      />
      {sp.denied && <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">That page is for the owner only.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="rupee" label="Today's sale" value={inr(todayRev.v)} hint={`${todayRev.bills} bills`} tone="brass" />
        <Stat icon="expenses" label="Today's expense" value={inr(todayExp.v)} />
        <Stat icon="reports" label="This month sale" value={inr(monthRev.v)} hint={`${monthRev.bills} bills`} />
        {me.role === "owner" ? (
          <Stat icon="reports" label="Month profit (approx.)" value={inr(profit)} tone={profit >= 0 ? "good" : "bad"} hint="Sale − expenses − purchases" />
        ) : (
          <Stat icon="customers" label="Customers" value={custCount.v} />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon="bills" title="Today's bills" className="lg:col-span-2" pad={false} action={<Link href="/visits" className="text-xs text-brass-dark">All bills <ArrowRight size={12} /></Link>}>
          {recent.length === 0 ? <Empty>No bills yet today.</Empty> : (
            <Table>
              <thead><tr><th>#</th><th>Customer</th><th>Services</th><th>Seat</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td><Link className="text-brass-dark" href={`/visits/${r.id}`}>{r.id}</Link></td>
                    <td>{r.customer ?? "Walk-in"}</td>
                    <td className="max-w-[16rem] truncate text-black/60">{r.services}</td>
                    <td className="text-black/60">{r.seat ?? "—"}</td>
                    <td className="num text-right font-medium">{inr(r.total)} <span className="pill bg-black/5 text-black/55">{r.payment_mode}</span></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <div className="space-y-4">
          <Card icon="rupee" title="Collection by mode">
            {byMode.length === 0 ? <p className="text-sm text-black/45">—</p> : byMode.map((m) => (
              <div key={m.payment_mode} className="flex justify-between py-1 text-sm"><span>{m.payment_mode}</span><span className="num font-medium">{inr(m.v)}</span></div>
            ))}
          </Card>
          <Card icon="attendance" title={`Staff today · ${present}/${attendance.length} in`} action={<Link href="/attendance" className="text-xs text-brass-dark">Mark <ArrowRight size={12} /></Link>}>
            {attendance.length === 0 ? <p className="text-sm text-black/45">Add staff first.</p> : attendance.map((a) => {
              const w = byStaff.find((s) => s.name === a.name);
              return (
                <div key={a.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${a.status === "P" ? "bg-emerald-500" : a.status === "H" ? "bg-amber-500" : a.status ? "bg-red-400" : "bg-black/15"}`} />
                    {a.name}
                  </span>
                  <span className="num text-black/60">{w ? `${w.n} · ${inr(w.v)}` : ""}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card icon="cake" title="Birthday / anniversary today">
          {birthdays.length === 0 ? <p className="text-sm text-black/45">None today.</p> : birthdays.map((c) => {
            const isBday = c.dob && c.dob.slice(5) === t.slice(5);
            const link = waLink(c.phone, `Happy ${isBday ? "Birthday" : "Anniversary"} ${c.name}! 🎉 Wishes from ${settings.salon_name}. Visit us this week for a special treat.`);
            return (
              <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                <Link href={`/customers/${c.id}`}>{c.name} <span className="text-black/45">· {isBday ? "Birthday" : "Anniversary"}</span></Link>
                {link && c.whatsapp_consent ? <a className="btn-ghost btn-sm" href={link} target="_blank"><MessageCircle size={14} /> WhatsApp</a> : <span className="text-[11px] text-black/40">No consent</span>}
              </div>
            );
          })}
        </Card>
        <Card icon="bell" title={`Due for a visit (${settings.reminder_days}+ days)`}>
          {dueBack.length === 0 ? <p className="text-sm text-black/45">Nobody due right now.</p> : dueBack.map((c) => {
            const link = waLink(c.phone, `Hi ${c.name}, it's been a while! Time for your next grooming session at ${settings.salon_name}. Reply to book your slot.`);
            return (
              <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                <Link href={`/customers/${c.id}`}>{c.name} <span className="text-black/45">· {fmtDate(c.last)}</span></Link>
                {link && c.whatsapp_consent ? <a className="btn-ghost btn-sm" href={link} target="_blank"><BellRing size={13} /> Remind</a> : <span className="text-[11px] text-black/40">No consent</span>}
              </div>
            );
          })}
        </Card>
        <Card icon="alert" title="Low stock">
          {low.length === 0 ? <p className="text-sm text-black/45">All good.</p> : low.map((i) => (
            <div key={i.id} className="flex justify-between py-1 text-sm">
              <span>{i.name}</span><span className="num font-medium text-red-700">{Number(i.stock)} {i.unit}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
