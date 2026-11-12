import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { BillingForm } from "@/components/BillingForm";
import { today } from "@/lib/utils";

export default async function Billing({ searchParams }: { searchParams: Promise<{ customer?: string; appointment?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const sql = db();
  const [services, staff, seats, customers] = await Promise.all([
    sql`SELECT s.id, s.name, s.price, coalesce(c.name,'Other') AS category FROM services s LEFT JOIN service_categories c ON c.id = s.category_id
        WHERE s.active ORDER BY c.sort NULLS LAST, c.name, s.name`,
    sql`SELECT e.id, e.name FROM employees e WHERE e.active ORDER BY e.name`,
    sql`SELECT id, name FROM seats WHERE active ORDER BY id`,
    sql`SELECT id, name, phone FROM customers ORDER BY name`,
  ]);
  const plain = <T,>(rows: T[]) => JSON.parse(JSON.stringify(rows)) as T[];
  type Appt = { id: number; customer_id: number | null; seat_id: number | null; employee_id: number | null };
  let appt = null as Appt | null;
  let presetLines: { serviceId: number | null; name: string; employeeId: number | null; price: number }[] = [];
  if (sp.appointment) {
    const [a] = await sql`SELECT id, customer_id, seat_id, employee_id FROM appointments WHERE id = ${Number(sp.appointment)} AND visit_id IS NULL`;
    if (a) {
      appt = { id: a.id, customer_id: a.customer_id, seat_id: a.seat_id, employee_id: a.employee_id };
      const items = await sql`SELECT service_id, service_name, price FROM appointment_services WHERE appointment_id = ${a.id} ORDER BY id`;
      presetLines = items.map((i) => ({ serviceId: i.service_id, name: i.service_name, employeeId: a.employee_id, price: Number(i.price) }));
    }
  }
  return (
    <>
      <PageHeader icon="bill" title="New Bill" sub={sp.appointment ? `From appointment #${sp.appointment} — check services and save.` : "Pick customer, add services with the barber who did them, and save."} />
      <BillingForm
        services={plain(services as unknown as { id: number; name: string; price: number; category: string }[])}
        staff={plain(staff as unknown as { id: number; name: string }[])}
        seats={plain(seats as unknown as { id: number; name: string }[])}
        customers={plain(customers as unknown as { id: number; name: string; phone: string | null }[])}
        defaultDate={today()}
        presetCustomerId={appt?.customer_id ?? (sp.customer ? Number(sp.customer) : null)}
        presetSeatId={appt?.seat_id ?? null}
        presetLines={presetLines}
        appointmentId={appt?.id ?? null}
      />
    </>
  );
}
