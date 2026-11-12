"use client";

import { useState, useTransition } from "react";
import { setAttendance } from "@/lib/actions";

const ORDER = ["", "P", "H", "A", "W"];
const STYLE: Record<string, string> = {
  P: "bg-emerald-500 text-white", H: "bg-amber-400 text-white", A: "bg-red-400 text-white", W: "bg-sky-400 text-white", "": "bg-black/[0.04] text-black/50",
};

export function AttendanceCalendar({ employeeId, month, days, firstWeekday, initial, editable, todayStr }: {
  employeeId: number; month: string; days: number; firstWeekday: number; initial: Record<string, string>; editable: boolean; todayStr: string;
}) {
  const [map, setMap] = useState(initial);
  const [, start] = useTransition();

  function cycle(date: string) {
    if (!editable) return;
    const next = ORDER[(ORDER.indexOf(map[date] ?? "") + 1) % ORDER.length];
    setMap((m) => ({ ...m, [date]: next }));
    const fd = new FormData();
    fd.set("employee_id", String(employeeId)); fd.set("date", date); fd.set("status", next);
    start(() => setAttendance(fd));
  }

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-black/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const date = `${month}-${String(d).padStart(2, "0")}`;
          const st = map[date] ?? "";
          return (
            <button key={i} type="button" onClick={() => cycle(date)} disabled={!editable || date > todayStr}
              className={`aspect-square rounded-lg text-xs font-medium transition disabled:opacity-40 ${STYLE[st]} ${date === todayStr ? "ring-2 ring-brass" : ""}`}>
              <div>{d}</div><div className="text-[9px] leading-none">{st}</div>
            </button>
          );
        })}
      </div>
      {editable && <p className="mt-2 text-xs text-black/45">Tap a day to cycle: P (present) → H (half) → A (absent) → W (week off) → blank.</p>}
    </div>
  );
}
