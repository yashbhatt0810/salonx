import Link from "next/link";
import { Filter, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Card, Empty, PageHeader, Table } from "@/components/ui";
import { fmtDate, inr, today } from "@/lib/utils";

export default async function Visits({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; staff?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const to = sp.to || today();
  const from = sp.from || to;
  const staffId = sp.staff ? Number(sp.staff) : null;
  const sql = db();
  const [rows, staff] = await Promise.all([
    sql`SELECT v.id, v.visit_date, v.total, v.discount, v.payment_mode, c.id AS cid, c.name AS customer, s.name AS seat,
          (SELECT string_agg(vi.service_name || coalesce(' ('||e.name||')',''), ', ') FROM visit_items vi LEFT JOIN employees e ON e.id = vi.employee_id WHERE vi.visit_id = v.id) AS services
        FROM visits v LEFT JOIN customers c ON c.id = v.customer_id LEFT JOIN seats s ON s.id = v.seat_id
        WHERE v.visit_date BETWEEN ${from} AND ${to}
          ${staffId ? sql`AND EXISTS (SELECT 1 FROM visit_items WHERE visit_id = v.id AND employee_id = ${staffId})` : sql``}
        ORDER BY v.visit_date DESC, v.id DESC LIMIT 500`,
    sql`SELECT id, name FROM employees ORDER BY name`,
  ]);
  const total = rows.reduce((a, r) => a + Number(r.total), 0);
  return (
    <>
      <PageHeader icon="bills" title="Bills" sub={`${rows.length} bills · ${inr(total)}`} action={<Link href="/billing" className="btn-brass"><Plus size={15} /> New Bill</Link>} />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label><span className="label">From</span><input className="input" type="date" name="from" defaultValue={from} /></label>
        <label><span className="label">To</span><input className="input" type="date" name="to" defaultValue={to} /></label>
        <label><span className="label">Barber</span>
          <select className="input" name="staff" defaultValue={staffId ?? ""}>
            <option value="">All</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <button className="btn-primary"><Filter size={14} /> Show</button>
      </form>
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No bills in this range.</Empty> : (
          <Table>
            <thead><tr><th>Bill</th><th>Date</th><th>Customer</th><th>Services (barber)</th><th>Seat</th><th>Mode</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link className="font-medium text-brass-dark" href={`/visits/${r.id}`}>#{r.id}</Link></td>
                  <td className="whitespace-nowrap">{fmtDate(r.visit_date)}</td>
                  <td>{r.cid ? <Link href={`/customers/${r.cid}`}>{r.customer}</Link> : "Walk-in"}</td>
                  <td className="max-w-md text-black/65">{r.services}</td>
                  <td>{r.seat ?? "—"}</td>
                  <td>{r.payment_mode}</td>
                  <td className="num text-right font-medium">{inr(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
