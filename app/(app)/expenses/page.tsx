import { db } from "@/lib/db";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { addExpense, addExpenseCategory, deleteExpense, deleteExpenseCategory } from "@/lib/actions";
import { Card, Empty, MonthNav, PageHeader, Stat, Table } from "@/components/ui";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { PAYMENT_MODES, fmtDate, inr, monthLabel, monthRange, shiftMonth, thisMonth, today } from "@/lib/utils";

export default async function Expenses({ searchParams }: { searchParams: Promise<{ month?: string; cat?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const cat = sp.cat ?? "";
  const { start, end } = monthRange(month);
  const sql = db();
  const [cats, rows, byCat] = await Promise.all([
    sql`SELECT * FROM expense_categories ORDER BY name`,
    sql`SELECT x.*, e.name AS staff FROM expenses x LEFT JOIN employees e ON e.id = x.employee_id
        WHERE x.date BETWEEN ${start} AND ${end} ${cat ? sql`AND x.category = ${cat}` : sql``} ORDER BY x.date DESC, x.id DESC`,
    sql`SELECT category, sum(amount) AS v, count(*)::int AS n FROM expenses WHERE date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 2 DESC`,
  ]);
  const total = byCat.reduce((a, r) => a + Number(r.v), 0);
  const max = Math.max(1, ...byCat.map((r) => Number(r.v)));
  const extra = cat ? `&cat=${encodeURIComponent(cat)}` : "";
  return (
    <>
      <PageHeader icon="expenses" title="Expenses" sub="Salary, tea, fuel, rent, electricity and everything else"
        action={<MonthNav base="/expenses" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} extra={extra} />} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card icon="expenses" title="Add expense">
            <form action={addExpense} className="grid grid-cols-2 gap-2">
              <label className="col-span-2"><span className="label">Category</span>
                <select className="input" name="category" required>{cats.map((c) => <option key={c.id}>{c.name}</option>)}</select>
              </label>
              <label><span className="label">Amount ₹</span><input className="input" type="number" min={1} step="0.01" name="amount" required /></label>
              <label><span className="label">Date</span><input className="input" type="date" name="date" defaultValue={today()} /></label>
              <label><span className="label">Paid by</span><select className="input" name="payment_mode">{PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
              <label><span className="label">Note</span><input className="input" name="note" placeholder="optional" /></label>
              <button className="btn-primary col-span-2"><Plus size={14} /> Add expense</button>
            </form>
            <p className="mt-2 text-xs text-black/45">Staff salary & upad are best entered from the staff page — they appear here automatically.</p>
          </Card>
          <Stat label={`Total · ${monthLabel(month)}`} value={inr(total)} tone="bad" />
          <Card icon="list" title="By category">
            {byCat.length === 0 ? <p className="text-sm text-black/45">No expenses.</p> : byCat.map((r) => (
              <a key={r.category} href={`/expenses?month=${month}&cat=${encodeURIComponent(r.category)}`} className="block py-1.5">
                <div className="flex justify-between text-sm"><span>{r.category}</span><span className="num font-medium">{inr(r.v)}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-black/5"><div className="h-1.5 rounded-full bg-brass" style={{ width: `${(Number(r.v) / max) * 100}%` }} /></div>
              </a>
            ))}
          </Card>
          <Card icon="tag" title="Expense categories">
            <form action={addExpenseCategory} className="mb-2 flex gap-2">
              <input className="input" name="name" placeholder="New category" required /><button className="btn-ghost"><Plus size={14} /> Add</button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <form key={c.id} action={deleteExpenseCategory} className="pill gap-1 bg-black/5 py-1 pl-2.5 pr-1 text-xs">
                  {c.name}<input type="hidden" name="id" value={c.id} />
                  <button className="rounded-full px-1 text-black/40 hover:text-red-600" aria-label="Remove">✕</button>
                </form>
              ))}
            </div>
          </Card>
        </div>
        <Card title={cat ? `${cat} · ${rows.length} entries` : `All entries · ${rows.length}`} pad={false} className="lg:col-span-2"
          action={cat ? <a href={`/expenses?month=${month}`} className="text-xs text-brass-dark">Clear filter</a> : undefined}>
          {rows.length === 0 ? <Empty>No expenses this month.</Empty> : (
            <Table>
              <thead><tr><th>Date</th><th>Category</th><th>Note</th><th>Mode</th><th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td>{r.category}</td>
                    <td className="text-black/60">{r.note ?? ""}</td>
                    <td className="text-black/60">{r.payment_mode}</td>
                    <td className="num text-right font-medium">{inr(r.amount)}</td>
                    <td className="text-right"><form action={deleteExpense}><input type="hidden" name="id" value={r.id} /><ConfirmSubmit message="Delete this expense?">✕</ConfirmSubmit></form></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
