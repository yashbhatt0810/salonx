import type { SalaryRow } from "@/lib/salary";
import { inr } from "@/lib/utils";

export function SalaryBreakdown({ r, days }: { r: SalaryRow; days: number }) {
  const Line = ({ k, v, strong, neg }: { k: string; v: number; strong?: boolean; neg?: boolean }) => (
    <div className={`flex justify-between py-1 text-sm ${strong ? "border-t border-black/10 pt-2 font-semibold" : ""}`}>
      <span className={strong ? "" : "text-black/60"}>{k}</span><span className="num">{neg ? "− " : ""}{inr(v)}</span>
    </div>
  );
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
        <span className="pill bg-emerald-50 text-emerald-700">P {r.P}</span>
        <span className="pill bg-amber-50 text-amber-700">H {r.H}</span>
        <span className="pill bg-red-50 text-red-700">A {r.A}</span>
        <span className="pill bg-sky-50 text-sky-700">W {r.W}</span>
        {r.unmarked > 0 && <span className="pill bg-black/5 text-black/50">Unmarked {r.unmarked}</span>}
      </div>
      <Line k={`Base: ${inr(r.monthly_salary)} ÷ ${days} × ${r.paid_days} paid days`} v={r.base} />
      <Line k={`Commission: ${r.commission_pct}% of ${inr(r.service_sale)} sale`} v={r.commission} />
      <Line k="Bonus" v={r.bonus} />
      <Line k="Gross salary" v={r.gross} strong />
      <Line k="Upad (advance) taken" v={r.upad} neg />
      <Line k="Already paid" v={r.paid} neg />
      <div className={`mt-1 flex justify-between rounded-lg px-3 py-2 text-base font-semibold ${r.balance >= 0 ? "bg-brass-light" : "bg-red-50 text-red-700"}`}>
        <span>{r.balance >= 0 ? "Balance to pay" : "Over-paid"}</span><span className="num">{inr(Math.abs(r.balance))}</span>
      </div>
    </div>
  );
}
