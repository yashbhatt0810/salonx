import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { commissionSummary } from "@/lib/commission";
import { validMonth } from "@/lib/slip";
import { Card, Empty, MonthNav, PageHeader, Stat, Table } from "@/components/ui";
import { inr, monthLabel, shiftMonth, thisMonth } from "@/lib/utils";

export default async function Commission({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireOwner();
  const month = validMonth((await searchParams).month, thisMonth());
  const rows = await commissionSummary(month);
  const total = rows.reduce((a, r) => a + r.commission, 0);
  const sale = rows.reduce((a, r) => a + r.sale, 0);
  return (
    <>
      <PageHeader icon="commission" title="Commission" sub="Monthly commission hisab for every stylist"
        action={<MonthNav base="/commission" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon="rupee" label="Service sale" value={inr(sale)} />
        <Stat icon="commission" label="Total commission" value={inr(total)} tone="brass" />
        <Stat icon="staff" label="Stylists" value={rows.length} />
      </div>
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No staff.</Empty> : (
          <Table>
            <thead><tr><th>Stylist</th><th className="text-right">Services</th><th className="text-right">Sale</th><th className="text-right">Rate</th><th className="text-right">Commission</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td className="num text-right">{r.services}</td>
                  <td className="num text-right">{inr(r.sale)}</td>
                  <td className="num text-right">{r.pct}%</td>
                  <td className="num text-right font-semibold">{inr(r.commission)}</td>
                  <td className="whitespace-nowrap text-right">
                    <Link className="btn-ghost btn-sm" href={`/staff/${r.id}/commission?month=${month}`}>Hisab</Link>{" "}
                    <Link className="btn-ghost btn-sm" href={`/staff/${r.id}/slip?month=${month}`}>Slip</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
