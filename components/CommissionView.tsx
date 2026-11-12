import type { CommissionDetail } from "@/lib/commission";
import { Card, Stat, Table } from "./ui";
import { CommissionBars } from "./charts";
import { fmtDate, inr, monthRange } from "@/lib/utils";

export function CommissionView({ d, month }: { d: CommissionDetail; month: string }) {
  const { days } = monthRange(month);
  const chart = Array.from({ length: days }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    const r = d.days.find((x) => x.date === date);
    return { day: String(i + 1), sale: r?.sale ?? 0, commission: r?.commission ?? 0 };
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="commission" label="Commission rate" value={`${d.pct}%`} />
        <Stat icon="services" label="Services done" value={d.services} />
        <Stat icon="rupee" label="Service sale" value={inr(d.sale)} />
        <Stat icon="salary" label="Commission earned" value={inr(d.commission)} tone="brass" />
      </div>
      <Card icon="reports" title="Daily commission">
        {d.pct === 0 ? <p className="text-sm text-black/50">Commission rate is 0% — set it in the staff profile to earn commission.</p> : <CommissionBars data={chart} />}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon="calendar" title="Day-wise hisab" pad={false}>
          {d.days.length === 0 ? <p className="px-4 py-6 text-center text-sm text-black/45">No services this month.</p> : (
            <Table>
              <thead><tr><th>Date</th><th className="text-right">Services</th><th className="text-right">Sale</th><th className="text-right">Commission</th></tr></thead>
              <tbody>
                {d.days.map((r) => (
                  <tr key={r.date}><td>{fmtDate(r.date)}</td><td className="num text-right">{r.services}</td><td className="num text-right">{inr(r.sale)}</td><td className="num text-right font-medium">{inr(r.commission)}</td></tr>
                ))}
                <tr className="bg-brass-light/50 font-semibold"><td>Total</td><td className="num text-right">{d.services}</td><td className="num text-right">{inr(d.sale)}</td><td className="num text-right">{inr(d.commission)}</td></tr>
              </tbody>
            </Table>
          )}
        </Card>
        <Card icon="services" title="Service-wise hisab" pad={false}>
          {d.byService.length === 0 ? <p className="px-4 py-6 text-center text-sm text-black/45">No services this month.</p> : (
            <Table>
              <thead><tr><th>Service</th><th className="text-right">Count</th><th className="text-right">Sale</th><th className="text-right">Commission</th></tr></thead>
              <tbody>
                {d.byService.map((r) => (
                  <tr key={r.name}><td>{r.name}</td><td className="num text-right">{r.n}</td><td className="num text-right">{inr(r.sale)}</td><td className="num text-right font-medium">{inr(r.commission)}</td></tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
