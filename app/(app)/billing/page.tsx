import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { BillingForm } from "@/components/BillingForm";
import { today } from "@/lib/utils";

export default async function Billing({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
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
  return (
    <>
      <PageHeader icon="bill" title="New Bill" sub="Pick customer, add services with the barber who did them, and save." />
      <BillingForm
        services={plain(services as unknown as { id: number; name: string; price: number; category: string }[])}
        staff={plain(staff as unknown as { id: number; name: string }[])}
        seats={plain(seats as unknown as { id: number; name: string }[])}
        customers={plain(customers as unknown as { id: number; name: string; phone: string | null }[])}
        defaultDate={today()}
        presetCustomerId={sp.customer ? Number(sp.customer) : null}
      />
    </>
  );
}
