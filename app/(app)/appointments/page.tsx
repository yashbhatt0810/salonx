import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Globe, Phone, Plus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireBooker } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { STATUS_META, fmtTime, freeSlots, nowMinutes, stylists as getStylists, toMin, fromMin } from "@/lib/booking";
import { Card, PageHeader, Stat } from "@/components/ui";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CopyLink } from "@/components/CopyLink";
import { fmtDate, inr, today } from "@/lib/utils";

const PX = 1.4; // pixels per minute

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (date: string, n: number) => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + n); return iso(d); };

export default async function Appointments({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  await requireBooker();
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const view = sp.view === "week" ? "week" : "day";
  const st = await getSettings();
  const sql = db();
  const open = toMin(st.open_time);
  const close = toMin(st.close_time);

  const weekStart = view === "week" ? addDays(date, -((new Date(`${date}T00:00:00`).getDay() + 6) % 7)) : date;
  const rangeEnd = view === "week" ? addDays(weekStart, 6) : date;

  const [list, staff] = await Promise.all([
    sql`SELECT a.id, a.customer_name, a.phone, a.employee_id, a.date, a.start_time::text AS st, a.duration_min, a.status, a.source,
          e.name AS stylist, (SELECT string_agg(service_name, ', ') FROM appointment_services WHERE appointment_id = a.id) AS services,
          (SELECT coalesce(sum(price),0) FROM appointment_services WHERE appointment_id = a.id) AS est
        FROM appointments a LEFT JOIN employees e ON e.id = a.employee_id
        WHERE a.date BETWEEN ${weekStart} AND ${rangeEnd} ORDER BY a.date, a.start_time`,
    getStylists(date),
  ]);

  const dayList = list.filter((a) => a.date === date);
  const live = dayList.filter((a) => a.status !== "cancelled");
  const stats = {
    total: live.length,
    online: live.filter((a) => a.source === "online").length,
    done: live.filter((a) => a.status === "completed").length,
    noShow: dayList.filter((a) => a.status === "no_show").length,
    est: live.reduce((x, a) => x + Number(a.est), 0),
  };

  const hours: number[] = [];
  for (let m = Math.ceil(open / 60) * 60; m < close; m += 60) hours.push(m);
  const slots: number[] = [];
  for (let m = open; m < close; m += st.slot_minutes) slots.push(m);
  const now = date === today() ? nowMinutes() : -1;
  const height = (close - open) * PX;

  // Live data for the "Today's chair" figure (Anatomy kit): booked share of today's stylist time.
  let figureSrc: string | null = null;
  if (view === "day" && date === today()) {
    const working = staff.filter((s) => !s.off).length;
    const capacity = working * (close - open);
    const bookedMin = live.reduce((x, a) => x + Number(a.duration_min), 0);
    const share = capacity > 0 ? Math.min(1, bookedMin / capacity) : 0;
    const free = await freeSlots(date, st.slot_minutes);
    const next = Object.values(free.slots).flat().sort()[0] ?? "";
    figureSrc = `/figures/barber-chair.html?booked=${share.toFixed(3)}&count=${live.length}&next=${next}`;
  }

  const nav = (d: string) => `/appointments?date=${d}${view === "week" ? "&view=week" : ""}`;
  const step = view === "week" ? 7 : 1;

  return (
    <>
      <PageHeader
        icon="calendar"
        title="Appointments"
        sub={view === "week" ? `${fmtDate(weekStart)} – ${fmtDate(rangeEnd)}` : `${fmtDate(date)} · ${st.open_time}–${st.close_time}`}
        action={<>
          <AutoRefresh seconds={20} />
          <CopyLink path="/book" />
          <Link href={`/appointments/new?date=${date}`} className="btn-brass"><Plus size={15} /> New booking</Link>
        </>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Link className="btn-ghost btn-sm" href={nav(addDays(date, -step))}><ChevronLeft size={14} /></Link>
          <Link className="btn-ghost btn-sm" href={`/appointments${view === "week" ? "?view=week" : ""}`}><CalendarDays size={14} /> Today</Link>
          <Link className="btn-ghost btn-sm" href={nav(addDays(date, step))}><ChevronRight size={14} /></Link>
        </div>
        <form className="flex items-center gap-1">
          <input type="date" name="date" defaultValue={date} className="input w-auto py-1" />
          {view === "week" && <input type="hidden" name="view" value="week" />}
          <button className="btn-ghost btn-sm">Go</button>
        </form>
        <div className="ml-auto flex rounded-lg border border-black/10 bg-white p-0.5 text-xs">
          <Link href={`/appointments?date=${date}`} className={`rounded-md px-3 py-1 ${view === "day" ? "bg-ink text-white" : ""}`}>Day</Link>
          <Link href={`/appointments?date=${date}&view=week`} className={`rounded-md px-3 py-1 ${view === "week" ? "bg-ink text-white" : ""}`}>Week</Link>
        </div>
      </div>

      {view === "day" ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat icon="calendar" label="Bookings" value={stats.total} />
            <Stat icon="globe" label="Online" value={stats.online} />
            <Stat icon="list" label="Completed" value={stats.done} tone="good" />
            <Stat icon="alert" label="No show" value={stats.noShow} tone={stats.noShow ? "bad" : "default"} />
            <Stat icon="rupee" label="Expected sale" value={inr(stats.est)} tone="brass" />
          </div>

          {figureSrc && (
            <Card icon="seats" title="Today's chair" className="mb-4" pad={false}
              action={<span className="text-[11px] text-black/45">Chair height = share of today&apos;s stylist time booked</span>}>
              <iframe title="Today's chair — live booking figure" src={figureSrc} className="mx-auto block aspect-[640/545] w-full max-w-2xl border-0" loading="lazy" />
            </Card>
          )}

          {staff.length === 0 ? (
            <Card><p className="py-6 text-center text-sm text-black/50">Add stylists in <Link href="/staff" className="text-brass-dark underline">Staff</Link> to start booking.</p></Card>
          ) : (
            <div className="card overflow-x-auto">
              <div className="flex min-w-max">
                {/* time gutter */}
                <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-black/5 bg-white">
                  <div className="h-14 border-b border-black/5" />
                  <div className="relative" style={{ height }}>
                    {hours.map((m) => (
                      <div key={m} className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-black/40" style={{ top: (m - open) * PX }}>
                        {fmtTime(fromMin(m)).replace(":00", "")}
                      </div>
                    ))}
                  </div>
                </div>

                {staff.map((s) => {
                  const mine = dayList.filter((a) => a.employee_id === s.id);
                  return (
                    <div key={s.id} className="w-52 shrink-0 border-r border-black/5 last:border-r-0">
                      <div className="sticky top-0 flex h-14 items-center gap-2 border-b border-black/5 bg-white px-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: s.color }}>{s.name.slice(0, 1)}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{s.name}</div>
                          <div className="text-[11px] text-black/45">{s.off ? "Off today" : `${mine.filter((a) => a.status !== "cancelled").length} bookings`}</div>
                        </div>
                      </div>
                      <div className={`relative ${s.off ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.03)_6px,rgba(0,0,0,0.03)_12px)]" : ""}`} style={{ height }}>
                        {hours.map((m) => <div key={m} className="absolute inset-x-0 border-t border-black/5" style={{ top: (m - open) * PX }} />)}
                        {!s.off && slots.map((m) => (
                          <Link key={m} href={`/appointments/new?date=${date}&time=${fromMin(m)}&stylist=${s.id}`}
                            className="group absolute inset-x-0 block hover:bg-brass-light/60" style={{ top: (m - open) * PX, height: st.slot_minutes * PX }}>
                            <span className="hidden pl-2 text-[10px] text-brass-dark group-hover:inline">+ {fmtTime(fromMin(m))}</span>
                          </Link>
                        ))}
                        {mine.map((a) => {
                          const top = (toMin(a.st) - open) * PX;
                          const h = Math.max(22, Number(a.duration_min) * PX - 2);
                          const meta = STATUS_META[a.status];
                          return (
                            <Link key={a.id} href={`/appointments/${a.id}`}
                              className={`absolute inset-x-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-[11px] leading-tight shadow-sm transition hover:shadow-md ${meta.cls}`}
                              style={{ top, height: h, borderLeft: `3px solid ${s.color}` }}>
                              <div className="flex items-center gap-1 font-semibold">
                                {a.source === "online" && <Globe size={10} />}{a.source === "phone" && <Phone size={10} />}
                                <span className="truncate">{a.customer_name}</span>
                              </div>
                              <div className="truncate opacity-75">{fmtTime(a.st)} · {a.services}</div>
                            </Link>
                          );
                        })}
                        {now >= open && now <= close && (
                          <div className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-red-500" style={{ top: (now - open) * PX }}>
                            <span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-black/55">
            {Object.entries(STATUS_META).map(([k, m]) => <span key={k} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${m.dot}`} />{m.label}</span>)}
            <span className="flex items-center gap-1"><Globe size={11} /> Online</span>
            <span className="flex items-center gap-1"><Phone size={11} /> Phone</span>
            <span>· Tap an empty slot to book it</span>
          </div>
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
            const items = list.filter((a) => a.date === d && a.status !== "cancelled");
            const isToday = d === today();
            return (
              <div key={d} className={`card flex min-h-[10rem] flex-col p-3 ${isToday ? "ring-2 ring-brass" : ""}`}>
                <Link href={`/appointments?date=${d}`} className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}</span>
                  <span className="text-[11px] text-black/45">{items.length}</span>
                </Link>
                <div className="space-y-1">
                  {items.slice(0, 8).map((a) => (
                    <Link key={a.id} href={`/appointments/${a.id}`} className={`block truncate rounded-md border px-1.5 py-0.5 text-[11px] ${STATUS_META[a.status].cls}`}>
                      {fmtTime(a.st)} {a.customer_name}
                    </Link>
                  ))}
                  {items.length > 8 && <Link href={`/appointments?date=${d}`} className="text-[11px] text-brass-dark">+{items.length - 8} more</Link>}
                </div>
                <Link href={`/appointments/new?date=${d}`} className="mt-auto pt-2 text-[11px] text-black/45 hover:text-brass-dark"><Plus size={11} className="inline" /> Book</Link>
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <Card icon="list" title="Day list" className="mt-4" pad={false}>
          {dayList.length === 0 ? <p className="px-4 py-6 text-center text-sm text-black/45">No bookings on this day.</p> : (
            <div className="divide-y divide-black/5">
              {dayList.map((a) => (
                <Link key={a.id} href={`/appointments/${a.id}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.02]">
                  <span className="num w-20 font-medium">{fmtTime(a.st)}</span>
                  <span className="min-w-[8rem] flex-1 font-medium">{a.customer_name} <span className="font-normal text-black/45">{a.phone ?? ""}</span></span>
                  <span className="min-w-[10rem] flex-1 truncate text-black/60">{a.services}</span>
                  <span className="flex items-center gap-1 text-black/60"><Users size={12} /> {a.stylist ?? "—"}</span>
                  <span className={`pill border ${STATUS_META[a.status].cls}`}>{STATUS_META[a.status].label}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}
