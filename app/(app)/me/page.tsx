import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAny } from "@/lib/auth";
import { salarySheet } from "@/lib/salary";
import { Card, Empty, MonthNav, PageHeader, Stat, Table } from "@/components/ui";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { SalaryBreakdown } from "@/components/SalaryBreakdown";
import { fmtDate, inr, monthLabel, monthRange, shiftMonth, thisMonth, today } from "@/lib/utils";

export default async function MyPanel({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const me = await requireAny();
  if (!me.employeeId) redirect("/");
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const { start, end, days } = monthRange(month);
  const sql = db();
  const [att, work, [sheet], txns] = await Promise.all([
    sql`SELECT date, status FROM attendance WHERE employee_id = ${me.employeeId} AND date BETWEEN ${start} AND ${end}`,
    sql`SELECT v.visit_date, vi.service_name, vi.price*vi.qty AS amt, c.name AS customer FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        LEFT JOIN customers c ON c.id = v.customer_id WHERE vi.employee_id = ${me.employeeId} AND v.visit_date BETWEEN ${start} AND ${end}
        ORDER BY v.visit_date DESC, vi.id DESC`,
    salarySheet(month, me.employeeId),
    sql`SELECT type, amount, date, note FROM employee_txns WHERE employee_id = ${me.employeeId} AND salary_month = ${month} ORDER BY date DESC`,
  ]);
  const todayWork = work.filter((w) => w.visit_date === today());
  return (
    <>
      <PageHeader title={`Hi, ${me.name.split(" ")[0]}`} sub="Your work, attendance and salary"
        action={<MonthNav base="/me" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="clock" label="Today" value={`${todayWork.length} services`} hint={inr(todayWork.reduce((a, w) => a + Number(w.amt), 0))} />
        <Stat icon="reports" label="This month" value={`${work.length} services`} hint={inr(sheet?.service_sale)} tone="brass" />
        <Stat icon="attendance" label="Paid days" value={`${sheet?.paid_days ?? 0} / ${days}`} />
        <Stat icon="salary" label="Balance salary" value={inr(sheet?.balance)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card icon="attendance" title="My attendance">
          <AttendanceCalendar employeeId={me.employeeId} month={month} days={days} firstWeekday={new Date(`${start}T00:00:00`).getDay()}
            initial={Object.fromEntries(att.map((a) => [a.date, a.status]))} editable={false} todayStr={today()} />
        </Card>
        {sheet && <Card icon="salary" title="My salary"><SalaryBreakdown r={sheet} days={days} />
          {txns.length > 0 && <div className="mt-3 border-t border-black/5 pt-2 text-xs text-black/55">
            {txns.map((t, i) => <div key={i} className="flex justify-between py-0.5"><span>{fmtDate(t.date)} · {t.type === "upad" ? "Upad" : t.type === "bonus" ? "Bonus" : "Salary paid"}</span><span className="num">{inr(t.amount)}</span></div>)}
          </div>}
        </Card>}
      </div>
      <Card icon="services" title="My services" pad={false} className="mt-4">
        {work.length === 0 ? <Empty>No services this month.</Empty> : (
          <Table>
            <thead><tr><th>Date</th><th>Service</th><th>Customer</th><th className="text-right">Amount</th></tr></thead>
            <tbody>{work.map((w, i) => <tr key={i}><td className="whitespace-nowrap">{fmtDate(w.visit_date)}</td><td>{w.service_name}</td><td className="text-black/60">{w.customer ?? "Walk-in"}</td><td className="num text-right">{inr(w.amt)}</td></tr>)}</tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
