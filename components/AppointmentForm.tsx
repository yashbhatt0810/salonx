"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock, Phone, Save, Scissors, Search, Sparkles, UserRound, Users } from "lucide-react";
import { saveAppointment } from "@/lib/appointment-actions";

type Svc = { id: number; name: string; price: number; duration_min: number | null; category: string };
type Opt = { id: number; name: string };
type Cust = { id: number; name: string; phone: string | null };

export type ApptInitial = {
  id?: number;
  customerId?: number | null;
  customerName?: string;
  phone?: string | null;
  employeeId?: number | null;
  seatId?: number | null;
  date: string;
  time?: string;
  serviceIds?: number[];
  notes?: string | null;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const fmt = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function AppointmentForm({ services, stylists, seats, customers, initial }: {
  services: Svc[]; stylists: Opt[]; seats: Opt[]; customers: Cust[]; initial: ApptInitial;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<number | null>(initial.customerId ?? null);
  const [name, setName] = useState(initial.customerName ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [consent, setConsent] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number[]>(initial.serviceIds ?? []);
  const [stylist, setStylist] = useState<number | null>(initial.employeeId ?? null);
  const [seat, setSeat] = useState<number | null>(initial.seatId ?? null);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [mode, setMode] = useState<"counter" | "phone">("counter");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(t) || (c.phone ?? "").includes(t)).slice(0, 6);
  }, [q, customers]);

  const chosen = services.filter((s) => picked.includes(s.id));
  const total = chosen.reduce((a, s) => a + Number(s.price), 0);
  const minutes = chosen.reduce((a, s) => a + Number(s.duration_min ?? 30), 0);

  useEffect(() => {
    if (!date) return;
    const ctrl = new AbortController();
    setLoading(true);
    const p = new URLSearchParams({ date, services: picked.join(",") });
    if (stylist) p.set("stylist", String(stylist));
    fetch(`/api/slots?${p}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        let list: string[] = stylist ? (d.stylists?.[0]?.slots ?? []) : (d.any ?? []);
        // When editing, keep the current time selectable even though it is "busy" with this booking.
        if (initial.id && initial.time && date === initial.date && !list.includes(initial.time)) list = [...list, initial.time].sort();
        setSlots(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [date, stylist, picked, initial.id, initial.time, initial.date]);

  const byCat = useMemo(() => {
    const m = new Map<string, Svc[]>();
    for (const s of services) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return Array.from(m.entries());
  }, [services]);

  function submit() {
    setError(null);
    if (!name.trim()) return setError("Enter customer name");
    if (picked.length === 0) return setError("Select services");
    if (!time) return setError("Pick a time slot");
    start(async () => {
      const res = await saveAppointment({
        id: initial.id ?? null, customerId, customerName: name, phone: phone || null, consent,
        employeeId: stylist, seatId: seat, date, time, serviceIds: picked, notes, source: mode,
      });
      if (!res.ok) setError(res.error);
      else router.push(`/appointments/${res.id}?saved=1`);
    });
  }

  const section = "card p-4";
  const h2 = "mb-3 flex items-center gap-2 text-sm font-semibold";

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <section className={section}>
          <h2 className={h2}><UserRound size={16} className="text-brass-dark" /> Customer</h2>
          {customerId ? (
            <div className="flex items-center justify-between rounded-lg bg-brass-light px-3 py-2">
              <div><div className="font-medium">{name}</div><div className="text-xs text-black/55">{phone || "No phone"}</div></div>
              <button className="btn-ghost btn-sm" onClick={() => { setCustomerId(null); setName(""); setPhone(""); }}>Change</button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                <input className="input pl-9" placeholder="Search existing customer…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {matches.length > 0 && (
                <div className="mt-2 divide-y divide-black/5 rounded-lg border border-black/10">
                  {matches.map((c) => (
                    <button key={c.id} className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-black/[0.03]"
                      onClick={() => { setCustomerId(c.id); setName(c.name); setPhone(c.phone ?? ""); setQ(""); }}>
                      <span>{c.name}</span><span className="text-black/50">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="input" placeholder="Mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <label className="mt-2 flex items-start gap-2 text-xs text-black/65">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                Customer agrees to WhatsApp / SMS messages (reminders, offers).
              </label>
            </>
          )}
          {!initial.id && (
            <div className="mt-3 flex gap-1.5">
              {(["counter", "phone"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`pill gap-1 px-3 py-1 text-xs ${mode === m ? "bg-ink text-white" : "bg-black/5 text-black/60"}`}>
                  {m === "phone" ? <Phone size={12} /> : <Users size={12} />} {m === "phone" ? "Phone booking" : "At counter"}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={section}>
          <h2 className={h2}><Scissors size={16} className="text-brass-dark" /> Services</h2>
          <div className="space-y-3">
            {byCat.map(([cat, list]) => (
              <div key={cat}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/40">{cat}</div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => {
                    const on = picked.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${on ? "border-ink bg-ink text-white" : "border-black/10 hover:border-brass"}`}>
                        {on ? <Check size={13} /> : <Sparkles size={13} className="text-brass-dark" />}
                        {s.name} <span className={on ? "text-white/60" : "text-black/45"}>{inr(Number(s.price))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={section}>
          <h2 className={h2}><Users size={16} className="text-brass-dark" /> Stylist</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStylist(null)} className={`rounded-xl border px-3 py-2 text-sm ${stylist === null ? "border-ink bg-ink text-white" : "border-black/10"}`}>
              Any available
            </button>
            {stylists.map((s) => (
              <button key={s.id} onClick={() => setStylist(s.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${stylist === s.id ? "border-ink bg-ink text-white" : "border-black/10 hover:border-brass"}`}>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${stylist === s.id ? "bg-brass text-white" : "bg-brass-light text-brass-dark"}`}>{s.name.slice(0, 1)}</span>
                {s.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:col-span-2">
        <section className="card sticky top-20 p-4">
          <h2 className={h2}><CalendarDays size={16} className="text-brass-dark" /> Date & time</h2>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
            <select className="input" value={seat ?? ""} onChange={(e) => setSeat(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Seat (optional)</option>
              {seats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-black/50">
            <span className="flex items-center gap-1"><Clock size={12} /> Free slots {minutes ? `· ${minutes} min job` : ""}</span>
            {loading && <span>Checking…</span>}
          </div>
          <div className="mt-2 grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
            {slots?.map((t) => (
              <button key={t} onClick={() => setTime(t)}
                className={`rounded-lg border py-1.5 text-xs font-medium ${time === t ? "border-brass bg-brass text-white" : "border-black/10 hover:border-brass"}`}>
                {fmt(t)}
              </button>
            ))}
            {slots && slots.length === 0 && <p className="col-span-4 py-4 text-center text-sm text-black/45">No free slot on this day. Try another date or stylist.</p>}
          </div>
          <textarea className="input mt-3" rows={2} placeholder="Note (optional)" value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
          <div className="mt-3 space-y-1 border-t border-black/10 pt-3 text-sm">
            <div className="flex justify-between"><span className="text-black/55">Services</span><span>{chosen.length}</span></div>
            <div className="flex justify-between font-semibold"><span>Estimate</span><span className="num">{inr(total)}</span></div>
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <button className="btn-brass mt-3 w-full py-2.5" disabled={pending} onClick={submit}>
            <Save size={16} /> {pending ? "Saving…" : initial.id ? "Save changes" : time ? `Book for ${fmt(time)}` : "Book appointment"}
          </button>
        </section>
      </div>
    </div>
  );
}
