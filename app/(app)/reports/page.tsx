import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { Card, Empty, MonthNav, PageHeader, Stat, Table } from "@/components/ui";
import { inr, monthLabel, monthRange, shiftMonth, thisMonth } from "@/lib/utils";

export default async function Reports({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const { start, end } = monthRange(month);
  const sql = db();
  const [[sale], [exp], [pur], daily, byStaff, byService, byCat, byMode, [cust], trend] = await Promise.all([
    sql`SELECT coalesce(sum(total),0) AS v, coalesce(sum(discount),0) AS disc, count(*)::int AS bills FROM visits WHERE visit_date BETWEEN ${start} AND ${end}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM expenses WHERE date BETWEEN ${start} AND ${end}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM purchases WHERE date BETWEEN ${start} AND ${end}`,
    sql`SELECT d::date::text AS day,
          coalesce((SELECT sum(total) FROM visits WHERE visit_date = d::date),0) AS sale,
          coalesce((SELECT sum(amount) FROM expenses WHERE date = d::date),0) + coalesce((SELECT sum(amount) FROM purchases WHERE date = d::date),0) AS cost
        FROM generate_series(${start}::date, ${end}::date, '1 day') d`,
    sql`SELECT e.name, count(*)::int AS n, sum(vi.price*vi.qty) AS v FROM visit_items vi JOIN visits v ON v.id = vi.visit_id JOIN employees e ON e.id = vi.employee_id
        WHERE v.visit_date BETWEEN ${start} AND ${end} GROUP BY e.name ORDER BY v DESC`,
    sql`SELECT vi.service_name, count(*)::int AS n, sum(vi.price*vi.qty) AS v FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        WHERE v.visit_date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY v DESC LIMIT 15`,
    sql`SELECT category, sum(amount) AS v FROM expenses WHERE date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 2 DESC`,
    sql`SELECT payment_mode, sum(total) AS v, count(*)::int AS n FROM visits WHERE visit_date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 2 DESC`,
    sql`SELECT count(DISTINCT customer_id)::int AS uniq,
          count(DISTINCT customer_id) FILTER (WHERE customer_id IN (SELECT id FROM customers WHERE created_at >= ${start}::date AND created_at < (${end}::date + 1)))::int AS fresh
        FROM visits WHERE visit_date BETWEEN ${start} AND ${end}`,
    sql`SELECT to_char(m, 'YYYY-MM') AS month,
          coalesce((SELECT sum(total) FROM visits WHERE date_trunc('month', visit_date) = m),0) AS sale,
          coalesce((SELECT sum(amount) FROM expenses WHERE date_trunc('month', date) = m),0) + coalesce((SELECT sum(amount) FROM purchases WHERE date_trunc('month', date) = m),0) AS cost
        FROM generate_series(date_trunc('month', ${start}::date) - interval '5 months', date_trunc('month', ${start}::date), '1 month') m`,
  ]);
  const profit = Number(sale.v) - Number(exp.v) - Number(pur.v);
  const maxDay = Math.max(1, ...daily.map((d) => Math.max(Number(d.sale), Number(d.cost))));
  const maxTrend = Math.max(1, ...trend.map((t) => Math.max(Number(t.sale), Number(t.cost))));
  const avg = sale.bills ? Number(sale.v) / sale.bills : 0;

  return (
    <>
      <PageHeader title="Reports" sub="Profit & loss, staff performance, top services"
        action={<MonthNav base="/reports" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Sale" value={inr(sale.v)} hint={`${sale.bills} bills · avg ${inr(Math.round(avg))}`} tone="brass" />
        <Stat label="Expenses" value={inr(exp.v)} />
        <Stat label="Purchases" value={inr(pur.v)} />
        <Stat label="Net profit" value={inr(profit)} tone={profit >= 0 ? "good" : "bad"} />
        <Stat label="Customers served" value={cust.uniq} hint={`${cust.fresh} new · discount ${inr(sale.disc)}`} />
      </div>

      <Card title="Daily sale vs cost" className="mt-4">
        <div className="flex h-40 items-end gap-[3px]">
          {daily.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end gap-[1px]" title={`${d.day}: sale ${inr(d.sale)}, cost ${inr(d.cost)}`}>
              <div className="flex-1 rounded-t bg-brass" style={{ height: `${(Number(d.sale) / maxDay) * 100}%` }} />
              <div className="flex-1 rounded-t bg-black/15" style={{ height: `${(Number(d.cost) / maxDay) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-black/40"><span>1</span><span>{daily.length}</span></div>
        <div className="mt-2 flex gap-4 text-xs text-black/55"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-brass" />Sale</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-black/15" />Expenses + purchases</span></div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Staff performance" pad={false}>
          {byStaff.length === 0 ? <Empty>No data.</Empty> : (
            <Table><thead><tr><th>Barber</th><th className="text-right">Services</th><th className="text-right">Sale</th></tr></thead>
              <tbody>{byStaff.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num text-right">{r.n}</td><td className="num text-right font-medium">{inr(r.v)}</td></tr>)}</tbody></Table>
          )}
        </Card>
        <Card title="Top services" pad={false}>
          {byService.length === 0 ? <Empty>No data.</Empty> : (
            <Table><thead><tr><th>Service</th><th className="text-right">Count</th><th className="text-right">Sale</th></tr></thead>
              <tbody>{byService.map((r) => <tr key={r.service_name}><td>{r.service_name}</td><td className="num text-right">{r.n}</td><td className="num text-right font-medium">{inr(r.v)}</td></tr>)}</tbody></Table>
          )}
        </Card>
        <Card title="Expenses by category" pad={false}>
          {byCat.length === 0 ? <Empty>No expenses.</Empty> : (
            <Table><tbody>{byCat.map((r) => <tr key={r.category}><td>{r.category}</td><td className="num text-right font-medium">{inr(r.v)}</td></tr>)}
              <tr><td className="text-black/55">Purchases (stock)</td><td className="num text-right font-medium">{inr(pur.v)}</td></tr></tbody></Table>
          )}
        </Card>
        <Card title="Collection by payment mode" pad={false}>
          {byMode.length === 0 ? <Empty>No data.</Empty> : (
            <Table><tbody>{byMode.map((r) => <tr key={r.payment_mode}><td>{r.payment_mode}</td><td className="num text-right text-black/55">{r.n} bills</td><td className="num text-right font-medium">{inr(r.v)}</td></tr>)}</tbody></Table>
          )}
        </Card>
      </div>

      <Card title="Last 6 months" className="mt-4" pad={false}>
        <Table>
          <thead><tr><th>Month</th><th>Sale vs cost</th><th className="text-right">Sale</th><th className="text-right">Cost</th><th className="text-right">Profit</th></tr></thead>
          <tbody>
            {trend.map((t) => {
              const p = Number(t.sale) - Number(t.cost);
              return (
                <tr key={t.month}>
                  <td className="whitespace-nowrap">{monthLabel(t.month)}</td>
                  <td className="w-1/3"><div className="space-y-0.5">
                    <div className="h-1.5 rounded-full bg-brass" style={{ width: `${(Number(t.sale) / maxTrend) * 100}%` }} />
                    <div className="h-1.5 rounded-full bg-black/20" style={{ width: `${(Number(t.cost) / maxTrend) * 100}%` }} />
                  </div></td>
                  <td className="num text-right">{inr(t.sale)}</td><td className="num text-right">{inr(t.cost)}</td>
                  <td className={`num text-right font-semibold ${p < 0 ? "text-red-700" : "text-emerald-700"}`}>{inr(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
