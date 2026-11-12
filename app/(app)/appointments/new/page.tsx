import { requireAdmin } from "@/lib/auth";
import { bookingLists } from "@/lib/form-data";
import { PageHeader } from "@/components/ui";
import { AppointmentForm } from "@/components/AppointmentForm";
import { today } from "@/lib/utils";

export default async function NewAppointment({ searchParams }: { searchParams: Promise<{ date?: string; time?: string; stylist?: string; customer?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const lists = await bookingLists();
  const cust = sp.customer ? lists.customers.find((c: { id: number }) => c.id === Number(sp.customer)) : null;
  return (
    <>
      <PageHeader icon="calendar" title="New booking" sub="Pick services, stylist and a free time slot." />
      <AppointmentForm
        {...lists}
        initial={{
          date: sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today(),
          time: sp.time && /^\d{2}:\d{2}$/.test(sp.time) ? sp.time : undefined,
          employeeId: sp.stylist ? Number(sp.stylist) : null,
          customerId: cust?.id ?? null, customerName: cust?.name ?? "", phone: cust?.phone ?? "",
        }}
      />
    </>
  );
}
