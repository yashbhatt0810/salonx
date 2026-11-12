import { notFound } from "next/navigation";
import { Save } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addEmployeeTxn, deleteEmployee, deleteEmployeeTxn } from "@/lib/actions";
import { salarySheet } from "@/lib/salary";
import { Card, Empty, MonthNav, PageHeader, Stat, Table } from "@/components/ui";
import { EmployeeForm } from "@/components/EmployeeForm";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { SalaryBreakdown } from "@/components/SalaryBreakdown";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { PAYMENT_MODES, fmtDate, inr, monthLabel, monthRange, shiftMonth, thisMonth, today } from "@/lib/utils";

const TXN_LABEL: Record<string, string> = { upad: "Upad (advance)", bonus: "Bonus", salary_paid: "Salary paid" };

export default async function StaffPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const { start, end, days } = monthRange(month);
  const sql = db();
  const [e] = await sql`SELECT * FROM employees WHERE id = ${Number(id)}`;
  if (!e) notFound();
  const isOwner = me.role === "owner";

  const [att, txns, work, [sheet]] = await Promise.all([
    sql`SELECT date, status FROM attendance WHERE employee_id = ${e.id} AND date BETWEEN ${start} AND ${end}`,
    sql`SELECT * FROM employee_txns WHERE employee_id = ${e.id} AND salary_month = ${month} ORDER BY date DESC, id DESC`,
    sql`SELECT vi.service_name, count(*)::int AS n, sum(vi.price*vi.qty) AS amt FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        WHERE vi.employee_id = ${e.id} AND v.visit_date BETWEEN ${start} AND ${end} GROUP BY vi.service_name ORDER BY amt DESC`,
    salarySheet(month, e.id),
  ]);
  const attMap = Object.fromEntries(att.map((a) => [a.date, a.status]));
  const firstWeekday = new Date(`${start}T00:00:00`).getDay();
  const totalServices = work.reduce((a, w) => a + w.n, 0);

  return (
    <>
      <PageHeader
        title={e.name}
        sub={`${e.designation ?? e.role}${e.joining_date ? ` · joined ${fmtDate(e.joining_date)}` : ""}${e.active ? "" : " · not active"}`}
        action={<MonthNav base={`/staff/${e.id}`} month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="services" label="Services done" value={totalServices} />
        <Stat icon="rupee" label="Service sale" value={inr(sheet?.service_sale)} tone="brass" />
        <Stat icon="attendance" label="Paid days" value={`${sheet?.paid_days ?? 0} / ${days}`} />
        {isOwner && <Stat icon="salary" label="Balance to pay" value={inr(sheet?.balance)} tone={(sheet?.balance ?? 0) >= 0 ? "default" : "bad"} />}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={`Attendance · ${monthLabel(month)}`}>
          <AttendanceCalendar employeeId={e.id} month={month} days={days} firstWeekday={firstWeekday} initial={attMap} editable todayStr={today()} />
        </Card>
        {isOwner && sheet && (
          <Card icon="salary" title="Salary calculation">
            <SalaryBreakdown r={sheet} days={days} />
          </Card>
        )}
      </div>

      {isOwner && (
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <Card icon="rupee" title="Add upad / bonus / salary payment" className="lg:col-span-2">
            <form action={addEmployeeTxn} className="grid grid-cols-2 gap-2">
              <input type="hidden" name="employee_id" value={e.id} />
              <input type="hidden" name="salary_month" value={month} />
              <label className="col-span-2"><span className="label">Type</span>
                <select className="input" name="type">
                  <option value="upad">Upad (advance)</option><option value="bonus">Bonus</option><option value="salary_paid">Salary paid</option>
                </select>
              </label>
              <label><span className="label">Amount ₹</span><input className="input" type="number" min={1} name="amount" required defaultValue={sheet && sheet.balance > 0 ? undefined : undefined} /></label>
              <label><span className="label">Date</span><input className="input" type="date" name="date" defaultValue={today()} /></label>
              <label><span className="label">Paid by</span>
                <select className="input" name="payment_mode">{PAYMENT_MODES.filter((m) => m !== "Credit").map((m) => <option key={m}>{m}</option>)}</select>
              </label>
              <label><span className="label">Note</span><input className="input" name="note" /></label>
              <p className="col-span-2 text-xs text-black/45">Counts against {monthLabel(month)}. Upad and salary payments are also added to Expenses automatically.</p>
              <button className="btn-primary col-span-2"><Save size={14} /> Save</button>
            </form>
          </Card>
          <Card title={`Ledger · ${monthLabel(month)}`} pad={false} className="lg:col-span-3">
            {txns.length === 0 ? <Empty>No upad, bonus or payment this month.</Empty> : (
              <Table>
                <thead><tr><th>Date</th><th>Type</th><th>Note</th><th className="text-right">Amount</th><th></th></tr></thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap">{fmtDate(t.date)}</td>
                      <td>{TXN_LABEL[t.type]}</td>
                      <td className="text-black/55">{t.note ?? ""}</td>
                      <td className="num text-right font-medium">{inr(t.amount)}</td>
                      <td className="text-right"><form action={deleteEmployeeTxn}><input type="hidden" name="id" value={t.id} /><ConfirmSubmit message="Delete this entry?">✕</ConfirmSubmit></form></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card icon="services" title="Work this month" pad={false} className="lg:col-span-2">
          {work.length === 0 ? <Empty>No services yet.</Empty> : (
            <Table>
              <thead><tr><th>Service</th><th className="text-right">Count</th><th className="text-right">Amount</th></tr></thead>
              <tbody>{work.map((w) => <tr key={w.service_name}><td>{w.service_name}</td><td className="num text-right">{w.n}</td><td className="num text-right">{inr(w.amt)}</td></tr>)}</tbody>
            </Table>
          )}
        </Card>
        <div className="space-y-4 lg:col-span-3">
          <Card icon="staff" title="Profile"><EmployeeForm e={e as never} isOwner={isOwner} /></Card>
          {isOwner && (
            <form action={deleteEmployee} className="text-right">
              <input type="hidden" name="id" value={e.id} />
              <ConfirmSubmit message="Delete this staff member and their attendance & ledger? Tip: untick 'active' instead if they just left.">Delete staff</ConfirmSubmit>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
