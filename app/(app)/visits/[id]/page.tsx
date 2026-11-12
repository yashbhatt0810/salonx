import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { deleteVisit } from "@/lib/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { PrintButton } from "@/components/PrintButton";
import { fmtDate, inr, waLink } from "@/lib/utils";

export default async function Visit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const sql = db();
  const [v] = await sql`SELECT v.*, c.name AS customer, c.phone, s.name AS seat FROM visits v
    LEFT JOIN customers c ON c.id = v.customer_id LEFT JOIN seats s ON s.id = v.seat_id WHERE v.id = ${Number(id)}`;
  if (!v) notFound();
  const items = await sql`SELECT vi.*, e.name AS barber FROM visit_items vi LEFT JOIN employees e ON e.id = vi.employee_id WHERE vi.visit_id = ${v.id} ORDER BY vi.id`;
  const st = await getSettings();
  const text = [
    `*${st.salon_name}* — Bill #${v.id}`, fmtDate(v.visit_date), "",
    ...items.map((i) => `${i.service_name}${i.qty > 1 ? ` x${i.qty}` : ""} — ${inr(i.price * i.qty)}`),
    "", Number(v.discount) > 0 ? `Discount: -${inr(v.discount)}` : "", `*Total: ${inr(v.total)}* (${v.payment_mode})`, "", st.bill_footer,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  const wa = waLink(v.phone, text);

  return (
    <div className="mx-auto max-w-xl">
      {sp.new && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Bill saved.</div>}
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Link href="/billing" className="btn-brass">＋ Next bill</Link>
        {wa && <a href={wa} target="_blank" className="btn-ghost">Send on WhatsApp</a>}
        <PrintButton />
        {v.customer_id && <Link href={`/customers/${v.customer_id}`} className="btn-ghost">Customer</Link>}
      </div>
      <div className="card p-6">
        <div className="text-center">
          <div className="font-display text-2xl font-semibold">{st.salon_name}</div>
          {st.salon_address && <div className="text-xs text-black/55">{st.salon_address}</div>}
          {st.salon_phone && <div className="text-xs text-black/55">{st.salon_phone}</div>}
        </div>
        <div className="mt-4 flex justify-between border-y border-dashed border-black/15 py-2 text-sm">
          <div><div className="text-black/50">Bill #{v.id}</div><div>{fmtDate(v.visit_date)}</div></div>
          <div className="text-right"><div className="font-medium">{v.customer ?? "Walk-in"}</div><div className="text-black/50">{v.phone ?? ""}{v.seat ? ` · ${v.seat}` : ""}</div></div>
        </div>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="py-1.5">{i.service_name}{i.qty > 1 ? ` × ${i.qty}` : ""}<div className="text-xs text-black/45">{i.barber ?? ""}</div></td>
                <td className="num py-1.5 text-right">{inr(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 space-y-1 border-t border-dashed border-black/15 pt-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="num">{inr(v.subtotal)}</span></div>
          {Number(v.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span className="num">− {inr(v.discount)}</span></div>}
          <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="num">{inr(v.total)}</span></div>
          <div className="text-right text-xs text-black/50">Paid by {v.payment_mode}</div>
        </div>
        {v.notes && <p className="mt-3 rounded-lg bg-black/[0.03] p-2 text-xs text-black/60">{v.notes}</p>}
        <p className="mt-4 text-center text-xs text-black/50">{st.bill_footer}</p>
      </div>
      {me.role === "owner" && (
        <form action={deleteVisit} className="mt-4 text-right print:hidden">
          <input type="hidden" name="id" value={v.id} />
          <ConfirmSubmit message="Delete this bill permanently?">Delete bill</ConfirmSubmit>
        </form>
      )}
    </div>
  );
}
