import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { deleteCustomer } from "@/lib/actions";
import { Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { CustomerForm } from "@/components/CustomerForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { daysSince, fmtDate, inr, waLink } from "@/lib/utils";

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ dup?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const sql = db();
  const [c] = await sql`SELECT * FROM customers WHERE id = ${Number(id)}`;
  if (!c) notFound();
  const [visits, items, favStaff] = await Promise.all([
    sql`SELECT v.id, v.visit_date, v.total, v.discount, v.payment_mode, v.notes, s.name AS seat FROM visits v LEFT JOIN seats s ON s.id = v.seat_id
        WHERE v.customer_id = ${c.id} ORDER BY v.visit_date DESC, v.id DESC`,
    sql`SELECT vi.visit_id, vi.service_name, vi.price, vi.qty, e.name AS barber FROM visit_items vi
        JOIN visits v ON v.id = vi.visit_id LEFT JOIN employees e ON e.id = vi.employee_id WHERE v.customer_id = ${c.id} ORDER BY vi.id`,
    sql`SELECT e.name, count(*)::int AS n FROM visit_items vi JOIN visits v ON v.id = vi.visit_id JOIN employees e ON e.id = vi.employee_id
        WHERE v.customer_id = ${c.id} GROUP BY e.name ORDER BY n DESC LIMIT 1`,
  ]);
  const st = await getSettings();
  const spent = visits.reduce((a, v) => a + Number(v.total), 0);
  const last = visits[0];
  const lastItems = last ? items.filter((i) => i.visit_id === last.id) : [];
  const wa = waLink(c.phone, `Hi ${c.name}, greetings from ${st.salon_name}! `);

  return (
    <>
      <PageHeader
        title={c.name}
        sub={<>{c.phone ?? "No mobile"}{c.gender ? ` · ${c.gender}` : ""} · customer since {fmtDate(c.created_at?.toISOString?.() ?? String(c.created_at))}</>}
        action={<>
          <Link href={`/billing?customer=${c.id}`} className="btn-brass">＋ New bill</Link>
          {wa && <a href={wa} target="_blank" className="btn-ghost">WhatsApp</a>}
        </>}
      />
      {sp.dup && <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">A customer with this mobile already exists — opened the existing record.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Visits" value={visits.length} />
        <Stat label="Total spent" value={inr(spent)} tone="brass" />
        <Stat label="Last visit" value={last ? fmtDate(last.visit_date) : "—"} hint={last ? `${daysSince(last.visit_date)} days ago` : undefined} />
        <Stat label="Usual barber" value={favStaff[0]?.name ?? "—"} hint={favStaff[0] ? `${favStaff[0].n} services` : undefined} />
      </div>

      {last && (
        <Card title="Last time" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {lastItems.map((i, k) => (
              <span key={k} className="pill bg-brass-light px-3 py-1 text-sm text-ink">{i.service_name} <span className="ml-1 text-black/50">by {i.barber ?? "—"}</span></span>
            ))}
          </div>
          {last.notes && <p className="mt-2 text-sm text-black/60">Note: {last.notes}</p>}
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title="Visit history" pad={false} className="lg:col-span-3">
          {visits.length === 0 ? <Empty>No visits yet.</Empty> : (
            <Table>
              <thead><tr><th>Date</th><th>Services · barber</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap align-top"><Link className="text-brass-dark" href={`/visits/${v.id}`}>{fmtDate(v.visit_date)}</Link><div className="text-xs text-black/45">#{v.id}{v.seat ? ` · ${v.seat}` : ""}</div></td>
                    <td>
                      {items.filter((i) => i.visit_id === v.id).map((i, k) => (
                        <div key={k} className="text-sm">{i.service_name} <span className="text-black/45">— {i.barber ?? "—"}</span></div>
                      ))}
                      {v.notes && <div className="text-xs text-black/45">{v.notes}</div>}
                    </td>
                    <td className="num whitespace-nowrap text-right align-top font-medium">{inr(v.total)}<div className="text-xs font-normal text-black/45">{v.payment_mode}</div></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card title="Customer details">
            <CustomerForm c={c as never} />
          </Card>
          {me.role === "owner" && (
            <form action={deleteCustomer} className="text-right">
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmit message="Delete this customer? Their bills stay but become walk-in.">Delete customer</ConfirmSubmit>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
