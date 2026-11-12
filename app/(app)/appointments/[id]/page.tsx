import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, Clock, DoorOpen, MessageCircle, Play, ReceiptText, UserX } from "lucide-react";
import { db } from "@/lib/db";
import { requireBooker } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { setAppointmentStatus } from "@/lib/appointment-actions";
import { STATUS_META, fmtTime } from "@/lib/booking";
import { bookingLists } from "@/lib/form-data";
import { Card, PageHeader } from "@/components/ui";
import { AppointmentForm } from "@/components/AppointmentForm";
import { fmtDate, inr, waLink } from "@/lib/utils";

export default async function AppointmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const me = await requireBooker();
  const isAdmin = me.role !== "barber";
  const { id } = await params;
  const sp = await searchParams;
  const sql = db();
  const [a] = await sql`SELECT a.*, a.start_time::text AS st, e.name AS stylist, s.name AS seat FROM appointments a
    LEFT JOIN employees e ON e.id = a.employee_id LEFT JOIN seats s ON s.id = a.seat_id WHERE a.id = ${Number(id)}`;
  if (!a) notFound();
  const items = await sql`SELECT * FROM appointment_services WHERE appointment_id = ${a.id} ORDER BY id`;
  const st = await getSettings();
  const meta = STATUS_META[a.status];
  const est = items.reduce((x, i) => x + Number(i.price), 0);
  const confirm = waLink(a.phone,
    `Hi ${a.customer_name}, your appointment at ${st.salon_name} is confirmed for ${fmtDate(a.date)} at ${fmtTime(a.st)}` +
    `${a.stylist ? ` with ${a.stylist}` : ""}. Services: ${items.map((i) => i.service_name).join(", ")}. See you soon!`);
  const editable = !["completed", "cancelled", "no_show"].includes(a.status);

  const Btn = ({ status, label, Icon, cls = "btn-ghost" }: { status: string; label: string; Icon: typeof Play; cls?: string }) => (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={status} />
      <button className={cls}><Icon size={15} /> {label}</button>
    </form>
  );

  const lists = editable ? await bookingLists() : null;

  return (
    <>
      <PageHeader
        icon="calendar"
        title={a.customer_name}
        sub={<>{fmtDate(a.date)} · {fmtTime(a.st)} · {a.duration_min} min · {a.stylist ?? "Any stylist"}{a.source !== "counter" ? ` · ${a.source} booking` : ""}</>}
        action={<Link href={`/appointments?date=${a.date}`} className="btn-ghost"><ArrowLeft size={15} /> Calendar</Link>}
      />
      {sp.saved && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Booking saved.</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card icon="clock" title="Status" className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className={`pill border px-3 py-1 text-sm ${meta.cls}`}>{meta.label}</span>
            {a.visit_id && isAdmin && <Link href={`/visits/${a.visit_id}`} className="text-sm text-brass-dark underline">Bill #{a.visit_id}</Link>}
          </div>
          <div className="flex flex-wrap gap-2">
            {a.status === "booked" && <Btn status="arrived" label="Customer arrived" Icon={DoorOpen} cls="btn-primary" />}
            {(a.status === "booked" || a.status === "arrived") && <Btn status="in_service" label="Start service" Icon={Play} cls={a.status === "arrived" ? "btn-primary" : "btn-ghost"} />}
            {isAdmin && !a.visit_id && a.status !== "cancelled" && a.status !== "no_show" && (
              <Link href={`/billing?appointment=${a.id}`} className="btn-brass"><ReceiptText size={15} /> Complete & make bill</Link>
            )}
            {a.status === "in_service" && <Btn status="completed" label="Mark completed" Icon={CheckCircle2} cls={isAdmin ? "btn-ghost" : "btn-primary"} />}
            {a.status === "booked" && <Btn status="no_show" label="No show" Icon={UserX} />}
            {editable && <Btn status="cancelled" label="Cancel booking" Icon={Ban} cls="btn-danger" />}
            {!editable && a.status !== "completed" && <Btn status="booked" label="Restore booking" Icon={Clock} />}
            {confirm && <a href={confirm} target="_blank" className="btn-ghost"><MessageCircle size={15} /> Send confirmation</a>}
          </div>
        </Card>
        <Card icon="services" title="Services">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between py-1 text-sm"><span>{i.service_name} <span className="text-black/40">· {i.duration_min}m</span></span><span className="num">{inr(i.price)}</span></div>
          ))}
          <div className="mt-2 flex justify-between border-t border-black/10 pt-2 text-sm font-semibold"><span>Estimate</span><span className="num">{inr(est)}</span></div>
          <div className="mt-3 space-y-0.5 text-xs text-black/55">
            {a.phone && <div>Mobile: {a.phone}</div>}
            {a.seat && <div>Seat: {a.seat}</div>}
            {a.notes && <div>Note: {a.notes}</div>}
            {a.customer_id && isAdmin && <Link href={`/customers/${a.customer_id}`} className="text-brass-dark underline">Customer history</Link>}
          </div>
        </Card>
      </div>

      {lists && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-black/60">Edit / reschedule</h2>
          <AppointmentForm
            {...lists}
            initial={{
              id: a.id, customerId: a.customer_id, customerName: a.customer_name, phone: a.phone,
              employeeId: a.employee_id, seatId: a.seat_id, date: a.date, time: a.st.slice(0, 5),
              serviceIds: items.map((i) => i.service_id).filter(Boolean), notes: a.notes,
            }}
          />
        </div>
      )}
    </>
  );
}
