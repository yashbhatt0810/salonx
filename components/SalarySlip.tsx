import type { SalaryRow } from "@/lib/salary";
import type { Settings } from "@/lib/settings";
import { amountInWords, empCode, fmtDate, inr, monthLabel } from "@/lib/utils";

type Emp = { id: number; name: string; designation: string | null; phone: string | null; joining_date: string | null };
type Txn = { type: string; amount: number; date: string; note: string | null };

export function SalarySlip({ e, r, month, days, st, txns }: { e: Emp; r: SalaryRow; month: string; days: number; st: Settings; txns: Txn[] }) {
  const net = r.gross - r.upad;
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between py-1 text-sm"><span className="text-black/60">{k}</span><span className="num">{v}</span></div>;
  return (
    <div className="card mx-auto max-w-3xl overflow-hidden print:border-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-ink px-6 py-5 text-white print:bg-white print:text-ink">
        <div>
          <div className="font-display text-2xl font-semibold">{st.salon_name}</div>
          <div className="text-xs opacity-60">{[st.salon_address, st.salon_phone].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-brass">Salary slip</div>
          <div className="font-display text-xl">{monthLabel(month)}</div>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-1 border-b border-black/10 px-6 py-4 text-sm sm:grid-cols-2">
        <Row k="Employee" v={<b>{e.name}</b>} />
        <Row k="Employee ID" v={empCode(e.id)} />
        <Row k="Designation" v={e.designation ?? "—"} />
        <Row k="Joining date" v={fmtDate(e.joining_date)} />
        <Row k="Monthly salary" v={inr(r.monthly_salary)} />
        <Row k="Commission rate" v={`${r.commission_pct}%`} />
      </div>

      <div className="grid grid-cols-5 gap-2 border-b border-black/10 px-6 py-4 text-center text-xs">
        {[["Days", days], ["Present", r.P], ["Half day", r.H], ["Absent", r.A], ["Paid days", r.paid_days]].map(([k, v]) => (
          <div key={String(k)} className="rounded-lg bg-black/[0.03] py-2"><div className="text-black/50">{k}</div><div className="num text-base font-semibold">{v}</div></div>
        ))}
      </div>

      <div className="grid gap-6 px-6 py-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">Earnings</div>
          <Row k={`Basic (${r.paid_days}/${days} days)`} v={inr(r.base)} />
          <Row k={`Commission (${r.commission_pct}% of ${inr(r.service_sale)})`} v={inr(r.commission)} />
          <Row k="Bonus" v={inr(r.bonus)} />
          <div className="mt-1 flex justify-between border-t border-black/10 pt-2 text-sm font-semibold"><span>Gross earnings</span><span className="num">{inr(r.gross)}</span></div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-700">Deductions</div>
          <Row k="Advance (upad)" v={inr(r.upad)} />
          <div className="mt-1 flex justify-between border-t border-black/10 pt-2 text-sm font-semibold"><span>Total deductions</span><span className="num">{inr(r.upad)}</span></div>
        </div>
      </div>

      <div className="mx-6 mb-4 rounded-xl bg-brass-light px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Net salary</span>
          <span className="num font-display text-2xl font-semibold">{inr(net)}</span>
        </div>
        <div className="text-xs text-black/60">{amountInWords(net)}</div>
        <div className="mt-2 flex justify-between border-t border-black/10 pt-2 text-sm">
          <span>Paid so far</span><span className="num">{inr(r.paid)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>{r.balance >= 0 ? "Balance payable" : "Over-paid"}</span><span className="num">{inr(Math.abs(r.balance))}</span>
        </div>
      </div>

      {txns.length > 0 && (
        <div className="px-6 pb-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-black/45">Payments & advances</div>
          {txns.map((t, i) => (
            <div key={i} className="flex justify-between py-0.5 text-xs text-black/65">
              <span>{fmtDate(t.date)} · {t.type === "upad" ? "Advance (upad)" : t.type === "bonus" ? "Bonus" : "Salary paid"}{t.note ? ` · ${t.note}` : ""}</span>
              <span className="num">{inr(t.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 px-6 pb-6 pt-8 text-xs text-black/55">
        <div><div className="h-8 border-b border-black/30" />Employee signature</div>
        <div className="text-right"><div className="h-8 border-b border-black/30" />For {st.owner_name || st.salon_name}</div>
      </div>
      <div className="border-t border-black/5 px-6 py-2 text-center text-[10px] text-black/40">Computer-generated slip from SalonX · {fmtDate(new Date().toISOString())}</div>
    </div>
  );
}
