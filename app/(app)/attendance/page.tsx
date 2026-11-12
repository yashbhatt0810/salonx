import Link from "next/link";
import { CircleCheck, CircleX, Clock, Coffee, CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveAttendanceDay } from "@/lib/actions";
import { Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate, today } from "@/lib/utils";

const OPTS = [["P", "Present", "peer-checked:bg-emerald-500", CircleCheck], ["H", "Half", "peer-checked:bg-amber-400", Clock], ["A", "Absent", "peer-checked:bg-red-400", CircleX], ["W", "Week off", "peer-checked:bg-sky-400", Coffee]] as const;

export default async function Attendance({ searchParams }: { searchParams: Promise<{ date?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const rows = await db()`SELECT e.id, e.name, e.designation, a.status FROM employees e
    LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ${date} WHERE e.active ORDER BY e.name`;
  const prev = new Date(`${date}T00:00:00`); prev.setDate(prev.getDate() - 1);
  const next = new Date(`${date}T00:00:00`); next.setDate(next.getDate() + 1);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <>
      <PageHeader icon="attendance" title="Attendance" sub={fmtDate(date)}
        action={<div className="flex gap-1">
          <Link className="btn-ghost btn-sm" href={`/attendance?date=${iso(prev)}`}><ChevronLeft size={14} /> Prev</Link>
          <Link className="btn-ghost btn-sm" href="/attendance"><CalendarDays size={14} /> Today</Link>
          {iso(next) <= today() && <Link className="btn-ghost btn-sm" href={`/attendance?date=${iso(next)}`}>Next <ChevronRight size={14} /></Link>}
        </div>} />
      {sp.saved && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Attendance saved.</div>}
      <Card className="max-w-2xl" pad={false}>
        {rows.length === 0 ? <Empty>Add staff first.</Empty> : (
          <form action={saveAttendanceDay}>
            <input type="hidden" name="date" value={date} />
            <div className="divide-y divide-black/5">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div><Link href={`/staff/${r.id}`} className="font-medium">{r.name}</Link><div className="text-xs text-black/45">{r.designation ?? ""}</div></div>
                  <div className="flex gap-1">
                    {OPTS.map(([v, label, cls, Ico]) => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" className="peer sr-only" name={`att_${r.id}`} value={v} defaultChecked={r.status ? r.status === v : v === "P"} />
                        <span className={`flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium peer-checked:border-transparent peer-checked:text-white ${cls}`}><Ico size={13} />{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-black/5 p-4"><button className="btn-primary"><Save size={14} /> Save attendance</button>
              <span className="ml-3 text-xs text-black/45">Everyone defaults to Present — change only who is off.</span></div>
          </form>
        )}
      </Card>
    </>
  );
}
