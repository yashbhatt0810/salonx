import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { salarySheet } from "@/lib/salary";
import { Card, Empty, MonthNav, PageHeader, Stat, Table } from "@/components/ui";
import { inr, monthLabel, monthRange, shiftMonth, thisMonth } from "@/lib/utils";

export default async function Salary({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const { days } = monthRange(month);
  const rows = await salarySheet(month);
  const sum = (k: keyof (typeof rows)[number]) => rows.reduce((a, r) => a + Number(r[k]), 0);
  return (
    <>
      <PageHeader title="Salary sheet" sub={`${days} days · P & W = full day, H = half, A = unpaid`}
        action={<MonthNav base="/salary" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Gross salary" value={inr(sum("gross"))} />
        <Stat label="Upad given" value={inr(sum("upad"))} />
        <Stat label="Already paid" value={inr(sum("paid"))} />
        <Stat label="Balance to pay" value={inr(sum("balance"))} tone="brass" />
      </div>
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No staff.</Empty> : (
          <Table>
            <thead><tr>
              <th>Staff</th><th className="text-right">Salary</th><th className="text-center">P/H/A/W</th><th className="text-right">Paid days</th>
              <th className="text-right">Base</th><th className="text-right">Commission</th><th className="text-right">Bonus</th><th className="text-right">Gross</th>
              <th className="text-right">Upad</th><th className="text-right">Paid</th><th className="text-right">Balance</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link className="font-medium hover:text-brass-dark" href={`/staff/${r.id}?month=${month}`}>{r.name}</Link>{r.unmarked > 0 && <div className="text-xs text-amber-700">{r.unmarked} days unmarked</div>}</td>
                  <td className="num text-right">{inr(r.monthly_salary)}</td>
                  <td className="num whitespace-nowrap text-center text-black/60">{r.P}/{r.H}/{r.A}/{r.W}</td>
                  <td className="num text-right">{r.paid_days}</td>
                  <td className="num text-right">{inr(r.base)}</td>
                  <td className="num text-right">{inr(r.commission)}</td>
                  <td className="num text-right">{inr(r.bonus)}</td>
                  <td className="num text-right font-medium">{inr(r.gross)}</td>
                  <td className="num text-right text-black/60">{inr(r.upad)}</td>
                  <td className="num text-right text-black/60">{inr(r.paid)}</td>
                  <td className={`num text-right font-semibold ${r.balance < 0 ? "text-red-700" : ""}`}>{inr(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-black/45">Open a staff member to add upad, bonus or record the salary payment.</p>
    </>
  );
}
