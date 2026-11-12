"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { animate, stagger } from "animejs";
import { PopIn, PressFeedback } from "./motion";
import { CalendarCheck2, Check, ChevronLeft, Clock, PartyPopper, Scissors, Sparkles, UserRound, Users } from "lucide-react";
import { publicBook } from "@/lib/appointment-actions";

type Svc = { id: number; name: string; price: number; duration_min: number; category: string };
type Sty = { id: number; name: string; designation: string | null };

const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
const fmt = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const dayLabel = (d: string, i: number) => i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });

export function BookingFlow({ services, stylists, days, salonName, salonPhone }: { services: Svc[]; stylists: Sty[]; days: string[]; salonName: string; salonPhone: string }) {
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<number[]>([]);
  const [stylist, setStylist] = useState<number | null>(null);
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ stylist: string | null; time: string } | null>(null);
  const [pending, start] = useTransition();
  const stepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stepRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const kids = Array.from(el.querySelectorAll<HTMLElement>(".card, h1, [data-anim]")).slice(0, 30);
    const a = animate(kids, { opacity: [0, 1], translateY: [12, 0], duration: 480, delay: stagger(35), ease: "outExpo" });
    return () => { a.revert(); };
  }, [step, done]);

  const chosen = services.filter((s) => picked.includes(s.id));
  const total = chosen.reduce((a, s) => a + Number(s.price), 0);
  const mins = chosen.reduce((a, s) => a + Number(s.duration_min), 0);
  const byCat = useMemo(() => {
    const m = new Map<string, Svc[]>();
    for (const s of services) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return Array.from(m.entries());
  }, [services]);

  useEffect(() => {
    if (step !== 3) return;
    let alive = true;
    const load = () => {
      const p = new URLSearchParams({ date, services: picked.join(",") });
      if (stylist) p.set("stylist", String(stylist));
      fetch(`/api/slots?${p}`, { cache: "no-store" }).then((r) => r.json()).then((d) => {
        if (!alive) return;
        const list: string[] = stylist ? (d.stylists?.[0]?.slots ?? []) : (d.any ?? []);
        setSlots(list);
        setTime((t) => (t && !list.includes(t) ? "" : t));
      }).catch(() => {});
    };
    setSlots(null);
    load();
    const iv = setInterval(load, 15000); // live: slots taken by others disappear
    return () => { alive = false; clearInterval(iv); };
  }, [step, date, stylist, picked]);

  function book() {
    setError(null);
    if (!name.trim()) return setError("Please enter your name");
    if (phone.replace(/\D/g, "").length < 10) return setError("Please enter your 10-digit mobile number");
    if (!agree) return setError("Please accept the Terms & Privacy Policy");
    start(async () => {
      const r = await publicBook({ customerName: name, phone, consent, employeeId: stylist, date, time, serviceIds: picked });
      if (!r.ok) { setError(r.error); if (/booked|free|slot/i.test(r.error)) { setStep(3); setTime(""); } }
      else setDone({ stylist: r.employeeName, time: r.time });
    });
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <PopIn className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><PartyPopper size={28} /></PopIn>
        <h1 className="mt-4 font-display text-2xl font-semibold">Booking confirmed!</h1>
        <p className="mt-2 text-black/65">
          {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} at <b>{fmt(done.time)}</b>
          {done.stylist && <> with <b>{done.stylist}</b></>}
        </p>
        <p className="mt-1 text-sm text-black/50">{chosen.map((s) => s.name).join(", ")} · approx. {inr(total)}</p>
        <p className="mt-4 text-sm text-black/55">Please arrive 5 minutes early.{salonPhone && <> To change, call <a className="text-brass-dark underline" href={`tel:${salonPhone}`}>{salonPhone}</a>.</>}</p>
      </div>
    );
  }

  const Steps = (
    <div className="mb-5 flex items-center gap-2 text-xs">
      {["Services", "Stylist", "Time", "Details"].map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <span className={`grid h-6 w-6 place-items-center rounded-full font-semibold ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-ink text-white" : "bg-black/10 text-black/45"}`}>
            {step > i + 1 ? <Check size={12} /> : i + 1}
          </span>
          <span className={`hidden sm:inline ${step === i + 1 ? "font-semibold" : "text-black/45"}`}>{l}</span>
          {i < 3 && <span className="h-px w-4 bg-black/15 sm:w-8" />}
        </div>
      ))}
    </div>
  );

  const Footer = ({ canNext, next, label = "Continue" }: { canNext: boolean; next: () => void; label?: string }) => (
    <div className="sticky bottom-0 mt-5 flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lg">
      <div className="text-sm">
        {chosen.length ? <><b>{chosen.length}</b> service{chosen.length > 1 ? "s" : ""} · {inr(total)} · {mins} min</> : "Select services"}
      </div>
      <button disabled={!canNext || pending} onClick={next} className="btn bg-brass text-white hover:bg-brass-dark">{pending ? "Booking…" : label}</button>
    </div>
  );

  return (
    <div ref={stepRef}>
      <PressFeedback />
      {Steps}
      {step > 1 && <button onClick={() => setStep(step - 1)} className="mb-3 flex items-center gap-1 text-sm text-black/55"><ChevronLeft size={15} /> Back</button>}

      {step === 1 && (
        <>
          <h1 className="mb-1 flex items-center gap-2 font-display text-2xl font-semibold"><Scissors size={22} className="text-brass-dark" /> Choose services</h1>
          <p className="mb-4 text-sm text-black/55">Book your slot at {salonName} in under a minute.</p>
          <div className="space-y-4">
            {byCat.map(([cat, list]) => (
              <div key={cat}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/45">{cat}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((s) => {
                    const on = picked.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                        className={`card flex items-center justify-between gap-3 p-3 text-left transition ${on ? "ring-2 ring-brass" : "hover:ring-1 hover:ring-black/10"}`}>
                        <span className="flex items-center gap-3">
                          <span className={`grid h-9 w-9 place-items-center rounded-xl ${on ? "bg-brass text-white" : "bg-brass-light text-brass-dark"}`}>{on ? <Check size={16} /> : <Sparkles size={16} />}</span>
                          <span><span className="block text-sm font-medium">{s.name}</span><span className="text-xs text-black/45">{s.duration_min} min</span></span>
                        </span>
                        <span className="num text-sm font-semibold">{inr(s.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Footer canNext={picked.length > 0} next={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold"><Users size={22} className="text-brass-dark" /> Choose your stylist</h1>
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={() => { setStylist(null); setStep(3); }} className={`card flex items-center gap-3 p-4 text-left ${stylist === null ? "ring-2 ring-brass" : ""}`}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-brass"><Sparkles size={18} /></span>
              <span><span className="block font-medium">Any available stylist</span><span className="text-xs text-black/50">Earliest free slot</span></span>
            </button>
            {stylists.map((s) => (
              <button key={s.id} onClick={() => { setStylist(s.id); setStep(3); }} className={`card flex items-center gap-3 p-4 text-left ${stylist === s.id ? "ring-2 ring-brass" : ""}`}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brass-light font-display text-lg font-semibold text-brass-dark">{s.name.slice(0, 1)}</span>
                <span><span className="block font-medium">{s.name}</span><span className="text-xs text-black/50">{s.designation ?? "Stylist"}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold"><CalendarCheck2 size={22} className="text-brass-dark" /> Pick date & time</h1>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {days.map((d, i) => (
              <button key={d} onClick={() => { setDate(d); setTime(""); }}
                className={`flex min-w-[4.5rem] flex-col items-center rounded-2xl border px-3 py-2 ${date === d ? "border-ink bg-ink text-white" : "border-black/10 bg-white"}`}>
                <span className="text-[11px] opacity-70">{dayLabel(d, i)}</span>
                <span className="text-lg font-semibold">{Number(d.slice(8))}</span>
                <span className="text-[10px] opacity-60">{new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span>
              </button>
            ))}
          </div>
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium"><Clock size={15} /> Available times</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>
            </div>
            {slots === null ? <p className="py-6 text-center text-sm text-black/45">Loading…</p> :
              slots.length === 0 ? <p className="py-6 text-center text-sm text-black/45">Fully booked on this day. Please try another date{stylist ? " or any stylist" : ""}.</p> : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((t) => (
                  <button key={t} onClick={() => setTime(t)} className={`rounded-xl border py-2 text-sm font-medium ${time === t ? "border-brass bg-brass text-white" : "border-black/10 hover:border-brass"}`}>{fmt(t)}</button>
                ))}
              </div>
            )}
          </div>
          <Footer canNext={!!time} next={() => setStep(4)} />
        </>
      )}

      {step === 4 && (
        <>
          <h1 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold"><UserRound size={22} className="text-brass-dark" /> Your details</h1>
          <div className="card space-y-3 p-4">
            <div className="rounded-xl bg-brass-light px-3 py-2 text-sm">
              <b>{new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, {fmt(time)}</b>
              {" · "}{stylist ? stylists.find((s) => s.id === stylist)?.name : "Any stylist"}{" · "}{chosen.map((s) => s.name).join(", ")}
            </div>
            <label className="block"><span className="label">Your name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <label className="block"><span className="label">Mobile number</span><input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="10-digit mobile" /></label>
            <label className="flex items-start gap-2 text-sm text-black/70">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              Send me booking updates, reminders and offers on WhatsApp / SMS. (optional — <a href="/consent" target="_blank" className="text-brass-dark underline">consent</a>)
            </label>
            <label className="flex items-start gap-2 text-sm text-black/70">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              I agree to the <a href="/terms" target="_blank" className="text-brass-dark underline">Terms</a> and <a href="/privacy" target="_blank" className="text-brass-dark underline">Privacy Policy</a>.
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>
          <Footer canNext={!!time} next={book} label="Confirm booking" />
        </>
      )}
    </div>
  );
}
