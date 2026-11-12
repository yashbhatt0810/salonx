import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2, CheckCircle2, ChevronRight, DoorOpen, FileSpreadsheet, Percent, Play, Scissors, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireAny } from "@/lib/auth";
import { salarySheet } from "@/lib/salary";
import { setAppointmentStatus } from "@/lib/appointment-actions";
import { STATUS_META, fmtTime, nowMinutes, toMin } from "@/lib/booking";
import { Card, MonthNav } from "@/components/ui";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { AutoRefresh } from "@/components/AutoRefresh";
import { empCode, fmtDate, inr, monthLabel, monthRange, shiftMonth, thisMonth, today } from "@/lib/utils";

export default async function MyPanel({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const me = await requireAny();
  if (!me.employeeId) redirect("/");
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const { start, end, days } = monthRange(month);
  const t = today();
  const sql = db();
  const [[emp], att, work, [sheet], appts] = await Promise.all([
    sql`SELECT id, name, designation, commission_pct FROM employees WHERE id = ${me.employeeId}`,
    sql`SELECT date, status FROM attendance WHERE employee_id = ${me.employeeId} AND date BETWEEN ${start} AND ${end}`,
    sql`SELECT v.visit_date, vi.service_name, vi.price*vi.qty AS amt, c.name AS customer FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        LEFT JOIN customers c ON c.id = v.customer_id WHERE vi.employee_id = ${me.employeeId} AND v.visit_date BETWEEN ${start} AND ${end}
        ORDER BY v.visit_date DESC, vi.id DESC`,
    salarySheet(month, me.employeeId),
    sql`SELECT a.id, a.customer_name, a.start_time::text AS st, a.duration_min, a.status, a.notes,
          (SELECT string_agg(service_name, ', ') FROM appointment_services WHERE appointment_id = a.id) AS services
        FROM appointments a WHERE a.employee_id = ${me.employeeId} AND a.date = ${t} AND a.status <> 'cancelled' ORDER BY a.start_time`,
  ]);
  const todayWork = work.filter((w) => w.visit_date === t);
  const todaySale = todayWork.reduce((a, w) => a + Number(w.amt), 0);
  const pct = Number(emp?.commission_pct ?? 0);
  const now = nowMinutes();
  const todayAtt = att.find((a) => a.date === t)?.status;
  const greet = now < 12 * 60 ? "Good morning" : now < 17 * 60 ? "Good afternoon" : "Good evening";

  const Tile = ({ href, Icon, title, value, hint }: { href: string; Icon: typeof Wallet; title: string; value: string; hint: string }) => (
    <Link href={href} className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-brass"><Icon size={22} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-black/50">{title}</span>
        <span className="num block text-lg font-semibold">{value}</span>
        <span className="block truncate text-[11px] text-black/45">{hint}</span>
      </span>
      <ChevronRight size={18} className="text-black/30 transition group-hover:translate-x-0.5 group-hover:text-brass-dark" />
    </Link>
  );

  const Action = ({ id, status, label, Icon, primary }: { id: number; status: string; label: string; Icon: typeof Play; primary?: boolean }) => (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
      <button className={`${primary ? "btn-brass" : "btn-ghost"} px-4 py-2.5`}><Icon size={16} /> {label}</button>
    </form>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white md:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brass/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brass font-display text-3xl font-semibold">{(emp?.name ?? me.name).slice(0, 1)}</span>
            <div>
              <div className="text-sm text-white/55">{greet},</div>
              <div className="font-display text-2xl font-semibold md:text-3xl">{emp?.name ?? me.name}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{empCode(me.employeeId)}</span>
                {emp?.designation && <span className="rounded-full bg-white/10 px-2 py-0.5">{emp.designation}</span>}
                <span className={`rounded-full px-2 py-0.5 ${todayAtt === "P" ? "bg-emerald-500/25 text-emerald-200" : todayAtt ? "bg-amber-500/25 text-amber-200" : "bg-white/10 text-white/60"}`}>
                  {todayAtt === "P" ? "Present today" : todayAtt === "H" ? "Half day" : todayAtt === "A" ? "Absent" : todayAtt === "W" ? "Week off" : "Attendance not marked"}
                </span>
              </div>
            </div>
          </div>
          <AutoRefresh seconds={30} />
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            ["Today's services", String(todayWork.length)],
            ["Today's sale", inr(todaySale)],
            ["Today's commission", inr((todaySale * pct) / 100)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/[0.07] p-3">
              <div className="text-[11px] text-white/50">{k}</div>
              <div className="num text-lg font-semibold md:text-2xl">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile href="#appointments" Icon={CalendarCheck2} title="Today's appointments" value={String(appts.length)} hint={appts.length ? `Next: ${appts.find((a) => ["booked", "arrived"].includes(a.status))?.customer_name ?? "—"}` : "No bookings yet"} />
        <Tile href={`/me/commission?month=${month}`} Icon={Percent} title={`Commission · ${monthLabel(month)}`} value={inr(sheet?.commission)} hint={`${pct}% of ${inr(sheet?.service_sale)}`} />
        <Tile href={`/me/slip?month=${month}`} Icon={FileSpreadsheet} title="Salary slip" value={inr(sheet?.balance)} hint="Balance payable · tap to view" />
        <Tile href="#attendance" Icon={Wallet} title="Paid days" value={`${sheet?.paid_days ?? 0} / ${days}`} hint={`P ${sheet?.P ?? 0} · H ${sheet?.H ?? 0} · A ${sheet?.A ?? 0}`} />
      </div>

      <section id="appointments" className="mt-6 scroll-mt-20">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><CalendarCheck2 size={20} className="text-brass-dark" /> Today&apos;s appointments</h2>
        {appts.length === 0 ? (
          <div className="card p-8 text-center text-sm text-black/50">No appointments booked for you today.</div>
        ) : (
          <div className="space-y-3">
            {appts.map((a) => {
              const meta = STATUS_META[a.status];
              const isNow = toMin(a.st) <= now && toMin(a.st) + Number(a.duration_min) > now;
              return (
                <div key={a.id} className={`card flex flex-wrap items-center gap-4 p-4 ${isNow && a.status !== "completed" ? "ring-2 ring-brass" : ""}`}>
                  <div className="w-20 text-center">
                    <div className="num font-display text-xl font-semibold">{fmtTime(a.st).split(" ")[0]}</div>
                    <div className="text-[11px] text-black/45">{fmtTime(a.st).split(" ")[1]} · {a.duration_min}m</div>
                  </div>
                  <div className="min-w-[10rem] flex-1">
                    <div className="font-semibold">{a.customer_name}</div>
                    <div className="text-sm text-black/55">{a.services}</div>
                    {a.notes && <div className="text-xs text-black/45">{a.notes}</div>}
                  </div>
                  <span className={`pill border ${meta.cls}`}>{meta.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "booked" && <Action id={a.id} status="arrived" label="Arrived" Icon={DoorOpen} />}
                    {(a.status === "booked" || a.status === "arrived") && <Action id={a.id} status="in_service" label="Start" Icon={Play} primary />}
                    {a.status === "in_service" && <Action id={a.id} status="completed" label="Done" Icon={CheckCircle2} primary />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">This month</h2>
        <MonthNav base="/me" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <section id="attendance" className="scroll-mt-20">
          <Card icon="attendance" title="My attendance">
            <AttendanceCalendar employeeId={me.employeeId} month={month} days={days} firstWeekday={new Date(`${start}T00:00:00`).getDay()}
              initial={Object.fromEntries(att.map((a) => [a.date, a.status]))} editable={false} todayStr={t} />
          </Card>
        </section>
        <Card icon="services" title={`My services · ${work.length}`} pad={false}>
          {work.length === 0 ? <p className="px-4 py-8 text-center text-sm text-black/45">No services this month.</p> : (
            <div className="max-h-[22rem] divide-y divide-black/5 overflow-y-auto">
              {work.slice(0, 60).map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brass-light text-brass-dark"><Scissors size={14} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate">{w.service_name}</span><span className="block text-xs text-black/45">{fmtDate(w.visit_date)} · {w.customer ?? "Walk-in"}</span></span>
                  <span className="num font-medium">{inr(w.amt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
