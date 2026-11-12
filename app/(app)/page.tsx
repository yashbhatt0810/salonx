import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, BellRing, CalendarClock, Lightbulb, MessageCircle, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { STATUS_META, fmtTime, nowMinutes, stylists as getStylists, toMin } from "@/lib/booking";
import { Card, PageHeader, Stat } from "@/components/ui";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Donut, HourBars, SalesTrend, StaffBars, WeekdayBars } from "@/components/charts";
import { fmtDate, inr, monthRange, shiftMonth, thisMonth, today, waLink } from "@/lib/utils";

type Insight = { tone: "good" | "bad" | "info"; text: React.ReactNode; href?: string };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const sql = db();
  const t = today();
  const month = thisMonth();
  const { start, end, days } = monthRange(month);
  const dom = Number(t.slice(8));
  const prev = monthRange(shiftMonth(month, -1));
  const prevSameDay = `${shiftMonth(month, -1)}-${String(Math.min(dom, prev.days)).padStart(2, "0")}`;
  const d30 = new Date(`${t}T00:00:00`); d30.setDate(d30.getDate() - 29);
  const from30 = iso(d30);
  const d60 = new Date(`${t}T00:00:00`); d60.setDate(d60.getDate() - 59);
  const from60 = iso(d60);
  const st = await getSettings();
  const hd = await headers();
  const origin = `${hd.get("x-forwarded-proto") ?? "https"}://${hd.get("x-forwarded-host") ?? hd.get("host")}`;

  const [
    [todayRev], [todayExp], [mtd], [lastMtd], [monthExp], [monthPur], trendRows, hourRows, weekdayRows,
    modeRows, staffRows, [repeat], [lapsed], appts, lowStock, birthdays, dueBack, [att], [prev30],
  ] = await Promise.all([
    sql`SELECT coalesce(sum(total),0) AS v, count(*)::int AS bills FROM visits WHERE visit_date = ${t}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM expenses WHERE date = ${t}`,
    sql`SELECT coalesce(sum(total),0) AS v, count(*)::int AS bills FROM visits WHERE visit_date BETWEEN ${start} AND ${t}`,
    sql`SELECT coalesce(sum(total),0) AS v, count(*)::int AS bills FROM visits WHERE visit_date BETWEEN ${prev.start} AND ${prevSameDay}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM expenses WHERE date BETWEEN ${start} AND ${end}`,
    sql`SELECT coalesce(sum(amount),0) AS v FROM purchases WHERE date BETWEEN ${start} AND ${end}`,
    sql`SELECT d::date::text AS day, coalesce(sum(v.total),0) AS sale, count(v.id)::int AS bills
        FROM generate_series(${from30}::date, ${t}::date, '1 day') d LEFT JOIN visits v ON v.visit_date = d::date GROUP BY d ORDER BY d`,
    sql`SELECT extract(hour FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS h, count(*)::int AS n
        FROM visits WHERE visit_date >= ${from30} GROUP BY 1 ORDER BY 1`,
    sql`SELECT extract(dow FROM d)::int AS dow, avg(coalesce(s.v,0)) AS avg FROM generate_series(${from60}::date, ${t}::date, '1 day') d
        LEFT JOIN (SELECT visit_date, sum(total) AS v FROM visits GROUP BY 1) s ON s.visit_date = d::date GROUP BY 1 ORDER BY 1`,
    sql`SELECT payment_mode AS name, sum(total) AS value FROM visits WHERE visit_date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 2 DESC`,
    sql`SELECT e.name, sum(vi.price*vi.qty) AS sale, count(*)::int AS services FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        JOIN employees e ON e.id = vi.employee_id WHERE v.visit_date BETWEEN ${start} AND ${end} GROUP BY e.name ORDER BY 2 DESC LIMIT 8`,
    sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE n > 1)::int AS returning FROM (
          SELECT v.customer_id, (SELECT count(*) FROM visits x WHERE x.customer_id = v.customer_id) AS n
          FROM visits v WHERE v.customer_id IS NOT NULL AND v.visit_date BETWEEN ${start} AND ${end} GROUP BY v.customer_id) q`,
    sql`SELECT count(*)::int AS n, count(*) FILTER (WHERE whatsapp_consent)::int AS reachable FROM (
          SELECT c.id, c.whatsapp_consent, max(v.visit_date) AS last FROM customers c JOIN visits v ON v.customer_id = c.id GROUP BY c.id) q
        WHERE last BETWEEN (${t}::date - 90) AND (${t}::date - ${st.reminder_days}::int)`,
    sql`SELECT a.id, a.customer_name, a.employee_id, a.start_time::text AS st, a.duration_min, a.status, a.source, e.name AS stylist,
          (SELECT string_agg(service_name, ', ') FROM appointment_services WHERE appointment_id = a.id) AS services
        FROM appointments a LEFT JOIN employees e ON e.id = a.employee_id
        WHERE a.date = ${t} AND a.status NOT IN ('cancelled') ORDER BY a.start_time`,
    sql`SELECT i.id, i.name, i.unit, i.min_stock,
          coalesce((SELECT sum(qty) FROM purchases WHERE item_id = i.id),0) - coalesce((SELECT sum(qty) FROM stock_usage WHERE item_id = i.id),0) AS stock
        FROM purchase_items i WHERE i.active AND i.min_stock > 0`,
    sql`SELECT id, name, phone, dob, anniversary, whatsapp_consent FROM customers
        WHERE (dob IS NOT NULL AND to_char(dob,'MM-DD') = to_char(${t}::date,'MM-DD'))
           OR (anniversary IS NOT NULL AND to_char(anniversary,'MM-DD') = to_char(${t}::date,'MM-DD'))`,
    sql`SELECT c.id, c.name, c.phone, c.whatsapp_consent, max(v.visit_date) AS last
        FROM customers c JOIN visits v ON v.customer_id = c.id
        GROUP BY c.id HAVING max(v.visit_date) BETWEEN (${t}::date - ${st.reminder_days + 7}::int) AND (${t}::date - ${st.reminder_days}::int)
        ORDER BY last LIMIT 8`,
    sql`SELECT (SELECT count(*)::int FROM employees WHERE active) AS staff,
               (SELECT count(*)::int FROM attendance a JOIN employees e ON e.id = a.employee_id WHERE e.active AND a.date = ${t}) AS marked`,
    sql`SELECT coalesce(avg(s),0) AS v FROM (SELECT d, coalesce((SELECT sum(total) FROM visits WHERE visit_date = d::date),0) AS s
          FROM generate_series((${from30}::date - 30), (${from30}::date - 1), '1 day') d) q`,
  ]);

  const stylists = await getStylists(t);
  const now = nowMinutes();

  // ── charts data
  const avgPrev = Number(prev30.v);
  const trend = trendRows.map((r) => ({
    day: new Date(`${r.day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    sale: Number(r.sale), bills: r.bills, avg: Math.round(avgPrev),
  }));
  const open = Math.floor(toMin(st.open_time) / 60);
  const close = Math.ceil(toMin(st.close_time) / 60);
  const hourly = [];
  for (let h = open; h < close; h++) {
    hourly.push({ hour: `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`, visits: hourRows.find((r) => r.h === h)?.n ?? 0 });
  }
  const peak = hourly.reduce((b, x) => (x.visits > (b?.visits ?? 0) ? x : b), null as null | { hour: string; visits: number });
  const weekday = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: WEEKDAYS[d], sale: Math.round(Number(weekdayRows.find((r) => r.dow === d)?.avg ?? 0)) }));
  const bestDay = weekday.reduce((b, x) => (x.sale > b.sale ? x : b), weekday[0]);
  const slowDay = weekday.reduce((b, x) => (x.sale < b.sale ? x : b), weekday[0]);
  const modes = modeRows.map((r) => ({ name: r.name, value: Number(r.value) }));
  const staffData = staffRows.map((r) => ({ name: r.name, sale: Number(r.sale), services: r.services }));

  // ── intelligence
  const mtdV = Number(mtd.v);
  const lastV = Number(lastMtd.v);
  const growth = lastV > 0 ? Math.round(((mtdV - lastV) / lastV) * 100) : null;
  const projected = Math.round((mtdV / dom) * days);
  const avgBill = mtd.bills ? mtdV / mtd.bills : 0;
  const lastAvgBill = lastMtd.bills ? lastV / lastMtd.bills : 0;
  const expRatio = mtdV > 0 ? Math.round(((Number(monthExp.v) + Number(monthPur.v)) / mtdV) * 100) : null;
  const profit = mtdV - Number(monthExp.v) - Number(monthPur.v);
  const low = lowStock.filter((r) => Number(r.stock) <= Number(r.min_stock));
  const repeatPct = repeat.total ? Math.round((repeat.returning / repeat.total) * 100) : null;
  const upcoming = appts.filter((a) => ["booked", "arrived"].includes(a.status) && toMin(a.st) + Number(a.duration_min) >= now);

  const insights: Insight[] = [];
  if (growth !== null)
    insights.push({ tone: growth >= 0 ? "good" : "bad", text: <>Sale is <b>{growth >= 0 ? "up" : "down"} {Math.abs(growth)}%</b> vs the same days last month ({inr(lastV)} → {inr(mtdV)}).</> });
  if (dom >= 3 && mtdV > 0) insights.push({ tone: "info", text: <>At this pace the month should close around <b>{inr(projected)}</b>.</>, href: "/reports" });
  if (peak && peak.visits > 0)
    insights.push({ tone: "info", text: <>Peak rush is around <b>{peak.hour.replace("a", " AM").replace("p", " PM")}</b>; busiest day is <b>{bestDay.day}</b>, slowest is <b>{slowDay.day}</b> — run a {slowDay.day} offer to fill chairs.</> });
  if (staffData[0]) insights.push({ tone: "good", text: <><b>{staffData[0].name}</b> leads this month with {inr(staffData[0].sale)} from {staffData[0].services} services.</>, href: "/commission" });
  if (avgBill && lastAvgBill)
    insights.push({ tone: avgBill >= lastAvgBill ? "good" : "bad", text: <>Average bill is <b>{inr(avgBill)}</b> ({avgBill >= lastAvgBill ? "↑" : "↓"} from {inr(lastAvgBill)}). {avgBill < lastAvgBill ? "Suggest add-ons like hair spa or beard styling." : ""}</> });
  if (repeatPct !== null) insights.push({ tone: repeatPct >= 50 ? "good" : "info", text: <><b>{repeatPct}%</b> of this month's customers are repeat customers.</>, href: "/customers?sort=visits" });
  if (lapsed.n > 0) insights.push({ tone: "bad", text: <><b>{lapsed.n}</b> customers haven't come back in {st.reminder_days}–90 days ({lapsed.reachable} can be messaged). Send reminders below.</> });
  if (expRatio !== null && expRatio > 60) insights.push({ tone: "bad", text: <>Expenses + purchases are <b>{expRatio}%</b> of sale this month — check where money is going.</>, href: "/expenses" });
  if (att.staff > 0 && att.marked < att.staff) insights.push({ tone: "bad", text: <>Attendance marked for <b>{att.marked}/{att.staff}</b> staff today.</>, href: "/attendance" });
  if (low.length) insights.push({ tone: "bad", text: <><b>{low.length}</b> item{low.length > 1 ? "s are" : " is"} running low on stock.</>, href: "/purchases" });
  if (upcoming.length) insights.push({ tone: "info", text: <><b>{upcoming.length}</b> appointments still to come today.</>, href: "/appointments" });

  // ── live stylist board
  const board = stylists.map((s) => {
    const mine = appts.filter((a) => a.employee_id === s.id);
    const current = mine.find((a) => a.status === "in_service" || (["arrived", "booked"].includes(a.status) && toMin(a.st) <= now && toMin(a.st) + Number(a.duration_min) > now));
    const next = mine.find((a) => ["booked", "arrived"].includes(a.status) && toMin(a.st) > now);
    return { ...s, current, next, count: mine.length };
  });

  return (
    <>
      <PageHeader
        icon="dashboard"
        title={`Hello, ${me.name.split(" ")[0]}`}
        sub={`${fmtDate(t)} · ${st.salon_name}`}
        action={<>
          <AutoRefresh seconds={30} />
          <Link href="/appointments/new" className="btn-ghost"><CalendarClock size={15} /> Book</Link>
          <Link href="/billing" className="btn-brass"><Plus size={15} /> New Bill</Link>
        </>}
      />
      {sp.denied && <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">That page is for the owner only.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="rupee" label="Today's sale" value={inr(todayRev.v)} hint={`${todayRev.bills} bills · expense ${inr(todayExp.v)}`} tone="brass" />
        <Stat icon="calendar" label="Today's bookings" value={appts.length} hint={`${upcoming.length} upcoming · ${appts.filter((a) => a.status === "completed").length} done`} />
        <Stat icon="reports" label="Month so far" value={inr(mtdV)}
          hint={growth !== null ? <span className={`inline-flex items-center gap-1 ${growth >= 0 ? "text-emerald-700" : "text-red-700"}`}>{growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(growth)}% vs last month</span> : `${mtd.bills} bills`} />
        {me.role === "owner"
          ? <Stat icon="salary" label="Month profit (approx.)" value={inr(profit)} tone={profit >= 0 ? "good" : "bad"} hint={`Projected sale ${inr(projected)}`} />
          : <Stat icon="customers" label="Avg bill" value={inr(avgBill)} />}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon="reports" title="Sales — last 30 days" className="lg:col-span-2" action={<span className="text-[11px] text-black/45">dashed = previous 30-day avg</span>}>
          <SalesTrend data={trend} />
        </Card>
        <Card icon="insight" title="Smart insights">
          {insights.length === 0 ? <p className="text-sm text-black/45">Insights appear once you have a few days of bills.</p> : (
            <ul className="space-y-2.5">
              {insights.slice(0, 7).map((i, k) => {
                const body = (
                  <span className="flex gap-2.5 text-[13px] leading-snug">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${i.tone === "good" ? "bg-emerald-50 text-emerald-600" : i.tone === "bad" ? "bg-red-50 text-red-600" : "bg-brass-light text-brass-dark"}`}>
                      {i.tone === "good" ? <TrendingUp size={11} /> : i.tone === "bad" ? <TrendingDown size={11} /> : <Lightbulb size={11} />}
                    </span>
                    <span className="text-black/75">{i.text}</span>
                  </span>
                );
                return <li key={k}>{i.href ? <Link href={i.href} className="block rounded-lg hover:bg-black/[0.02]">{body}</Link> : body}</li>;
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon="staff" title="Stylists — live" className="lg:col-span-2" action={<Link href="/appointments" className="flex items-center gap-1 text-xs text-brass-dark">Calendar <ArrowRight size={12} /></Link>}>
          {board.length === 0 ? <p className="text-sm text-black/45">Add stylists in Staff.</p> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {board.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-black/5 p-3">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full font-semibold text-white" style={{ background: s.color }}>
                    {s.name.slice(0, 1)}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${s.off ? "bg-black/30" : s.current ? "bg-violet-500" : "bg-emerald-500"}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{s.name}</span>
                      <span className="text-[11px] text-black/45">{s.count} today</span>
                    </div>
                    <div className="truncate text-xs text-black/55">
                      {s.off ? "Off today" : s.current ? <>Busy · {s.current.customer_name}</> : s.next ? <>Free · next {fmtTime(s.next.st)} {s.next.customer_name}</> : "Free — no more bookings"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card icon="calendar" title="Up next" pad={false} action={<Link href="/appointments/new" className="text-xs text-brass-dark">+ Book</Link>}>
          {upcoming.length === 0 ? <p className="px-4 py-6 text-center text-sm text-black/45">No upcoming bookings today.</p> : (
            <div className="divide-y divide-black/5">
              {upcoming.slice(0, 6).map((a) => (
                <Link key={a.id} href={`/appointments/${a.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.02]">
                  <span className="num w-16 text-sm font-semibold">{fmtTime(a.st)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{a.customer_name}</span>
                    <span className="block truncate text-xs text-black/45">{a.stylist ?? "—"} · {a.services}</span>
                  </span>
                  <span className={`h-2 w-2 rounded-full ${STATUS_META[a.status].dot}`} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon="clock" title="Rush hours (30 days)"><HourBars data={hourly} peak={peak?.hour ?? null} /></Card>
        <Card icon="calendar" title="Avg sale by weekday"><WeekdayBars data={weekday} /></Card>
        <Card icon="rupee" title="Payment mix (month)"><Donut data={modes} /></Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon="staff" title="Stylist leaderboard (month)" className="lg:col-span-1">
          {staffData.length === 0 ? <p className="text-sm text-black/45">No services yet this month.</p> : <StaffBars data={staffData} />}
        </Card>
        <Card icon="cake" title="Birthday / anniversary today">
          {birthdays.length === 0 ? <p className="text-sm text-black/45">None today.</p> : birthdays.map((c) => {
            const isBday = c.dob && c.dob.slice(5) === t.slice(5);
            const link = waLink(c.phone, `Happy ${isBday ? "Birthday" : "Anniversary"} ${c.name}! 🎉 Wishes from ${st.salon_name}. Visit us this week for a special treat.`);
            return (
              <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                <Link href={`/customers/${c.id}`}>{c.name} <span className="text-black/45">· {isBday ? "Birthday" : "Anniversary"}</span></Link>
                {link && c.whatsapp_consent ? <a className="btn-ghost btn-sm" href={link} target="_blank"><MessageCircle size={14} /> Wish</a> : <span className="text-[11px] text-black/40">No consent</span>}
              </div>
            );
          })}
        </Card>
        <Card icon="bell" title={`Due for a visit (${st.reminder_days}+ days)`}>
          {dueBack.length === 0 ? <p className="text-sm text-black/45">Nobody due right now.</p> : dueBack.map((c) => {
            const link = waLink(c.phone, `Hi ${c.name}, it's been a while! Time for your next grooming session at ${st.salon_name}. Book your slot here: ${origin}/book`);
            return (
              <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                <Link href={`/customers/${c.id}`}>{c.name} <span className="text-black/45">· {fmtDate(c.last)}</span></Link>
                {link && c.whatsapp_consent ? <a className="btn-ghost btn-sm" href={link} target="_blank"><BellRing size={13} /> Remind</a> : <span className="text-[11px] text-black/40">No consent</span>}
              </div>
            );
          })}
          {low.length > 0 && (
            <div className="mt-3 border-t border-black/5 pt-2">
              <div className="mb-1 text-xs font-semibold text-red-700">Low stock</div>
              {low.map((i) => <div key={i.id} className="flex justify-between text-sm"><span>{i.name}</span><span className="num text-red-700">{Number(i.stock)} {i.unit}</span></div>)}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
