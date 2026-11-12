"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBill } from "@/lib/actions";
import { Armchair, CalendarDays, Plus, ReceiptText, Search, Trash2, UserRound, Scissors } from "lucide-react";
import { Icon, categoryIcon } from "./icons";

type Svc = { id: number; name: string; price: number; category: string };
type Opt = { id: number; name: string };
type Cust = { id: number; name: string; phone: string | null };
type Line = { key: number; serviceId: number | null; name: string; employeeId: number | null; price: number; qty: number };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function BillingForm({ services, staff, seats, customers, defaultDate, presetCustomerId }: {
  services: Svc[]; staff: Opt[]; seats: Opt[]; customers: Cust[]; defaultDate: string; presetCustomerId: number | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const preset = customers.find((c) => c.id === presetCustomerId) ?? null;
  const [customer, setCustomer] = useState<Cust | null>(preset);
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newConsent, setNewConsent] = useState(false);
  const [seatId, setSeatId] = useState<number | null>(seats[0]?.id ?? null);
  const [date, setDate] = useState(defaultDate);
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [defaultEmp, setDefaultEmp] = useState<number | null>(staff[0]?.id ?? null);
  const [cat, setCat] = useState<string>("All");

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(t) || (c.phone ?? "").includes(t)).slice(0, 8);
  }, [q, customers]);

  const cats = useMemo(() => ["All", ...Array.from(new Set(services.map((s) => s.category)))], [services]);
  const shown = cat === "All" ? services : services.filter((s) => s.category === cat);

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const add = (s: Svc) => setLines((ls) => [...ls, { key: Date.now() + Math.random(), serviceId: s.id, name: s.name, employeeId: defaultEmp, price: Number(s.price), qty: 1 }]);
  const upd = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function save() {
    setError(null);
    if (lines.length === 0) return setError("Add at least one service.");
    if (lines.some((l) => !l.employeeId)) return setError("Select the barber for every service.");
    start(async () => {
      const res = await createBill({
        customerId: customer?.id ?? null,
        newCustomer: !customer && newName.trim() ? { name: newName.trim(), phone: newPhone.trim() || null, consent: newConsent } : null,
        seatId, date, discount: Number(discount) || 0, paymentMode: mode, notes: notes.trim() || null,
        items: lines.map(({ serviceId, name, employeeId, price, qty }) => ({ serviceId, name, employeeId, price: Number(price), qty: Number(qty) })),
      });
      if (!res.ok) setError(res.error);
      else router.push(`/visits/${res.visitId}?new=1`);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <section className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserRound size={16} className="text-brass-dark" /> 1 · Customer</h2>
          {customer ? (
            <div className="flex items-center justify-between rounded-lg bg-brass-light px-3 py-2">
              <div><div className="font-medium">{customer.name}</div><div className="text-xs text-black/55">{customer.phone ?? "No phone"}</div></div>
              <button className="btn-ghost btn-sm" onClick={() => setCustomer(null)}>Change</button>
            </div>
          ) : (
            <>
              <div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" /><input className="input pl-9" placeholder="Search by name or mobile…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              {matches.length > 0 && (
                <div className="mt-2 divide-y divide-black/5 rounded-lg border border-black/10">
                  {matches.map((c) => (
                    <button key={c.id} className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-black/[0.03]" onClick={() => { setCustomer(c); setQ(""); }}>
                      <span>{c.name}</span><span className="text-black/50">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input className="input" placeholder="New customer name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <input className="input" placeholder="Mobile" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
              {newName.trim() && (
                <label className="mt-2 flex items-start gap-2 text-xs text-black/65">
                  <input type="checkbox" checked={newConsent} onChange={(e) => setNewConsent(e.target.checked)} className="mt-0.5" />
                  <span>Customer agrees to WhatsApp / SMS messages (bills, reminders, offers). <a href="/consent" target="_blank" className="text-brass-dark underline">Consent</a></span>
                </label>
              )}
              <p className="mt-1.5 text-xs text-black/45">Leave both empty for a walk-in bill.</p>
            </>
          )}
        </section>

        <section className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Scissors size={16} className="text-brass-dark" /> 2 · Services</h2>
            <label className="flex items-center gap-2 text-xs text-black/55">
              Barber for next taps
              <select className="input w-auto py-1" value={defaultEmp ?? ""} onChange={(e) => setDefaultEmp(e.target.value ? Number(e.target.value) : null)}>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`pill gap-1 px-3 py-1 text-xs ${cat === c ? "bg-ink text-white" : "bg-black/5 text-black/65"}`}>{c !== "All" && <Icon name={categoryIcon(c)} size={12} />}{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shown.map((s) => (
              <button key={s.id} onClick={() => add(s)} className="rounded-xl border border-black/10 px-3 py-2.5 text-left transition hover:border-brass hover:bg-brass-light/50">
                <div className="flex items-start gap-2"><span className="mt-0.5 text-brass-dark"><Icon name={categoryIcon(s.category)} size={14} /></span><div className="text-sm font-medium leading-tight">{s.name}</div></div>
                <div className="num mt-0.5 pl-[22px] text-xs text-black/55">{inr(Number(s.price))}</div>
              </button>
            ))}
            {services.length === 0 && <p className="col-span-full text-sm text-black/45">No services yet — add them in Services.</p>}
          </div>
        </section>
      </div>

      <div className="lg:col-span-2">
        <section className="card sticky top-20 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ReceiptText size={16} className="text-brass-dark" /> 3 · Bill</h2>
          <div className="grid grid-cols-2 gap-2">
            <label><span className="label flex items-center gap-1"><CalendarDays size={12} /> Date</span><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label><span className="label flex items-center gap-1"><Armchair size={12} /> Seat</span>
              <select className="input" value={seatId ?? ""} onChange={(e) => setSeatId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">—</option>
                {seats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-3 divide-y divide-black/5">
            {lines.length === 0 && <p className="flex flex-col items-center gap-1 py-6 text-center text-sm text-black/45"><Plus size={18} />Tap services to add them here.</p>}
            {lines.map((l) => (
              <div key={l.key} className="py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <input className="w-full bg-transparent text-sm font-medium outline-none" value={l.name} onChange={(e) => upd(l.key, { name: e.target.value })} />
                  <button className="text-black/35 hover:text-red-600" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} aria-label="Remove"><Trash2 size={14} /></button>
                </div>
                <div className="mt-1.5 grid grid-cols-[1fr_4.5rem_3.5rem] gap-1.5">
                  <select className="input py-1 text-xs" value={l.employeeId ?? ""} onChange={(e) => upd(l.key, { employeeId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Barber…</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input className="input num py-1 text-xs" type="number" min={0} value={l.price} onChange={(e) => upd(l.key, { price: Number(e.target.value) })} />
                  <input className="input num py-1 text-xs" type="number" min={1} value={l.qty} onChange={(e) => upd(l.key, { qty: Math.max(1, Number(e.target.value)) })} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2 border-t border-black/10 pt-3 text-sm">
            <div className="flex justify-between"><span className="text-black/55">Subtotal</span><span className="num">{inr(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="text-black/55">Discount ₹</span>
              <input className="input num w-28 py-1 text-right" type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
            <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="num">{inr(total)}</span></div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {["Cash", "UPI", "Card", "Credit"].map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-xs font-medium ${mode === m ? "border-ink bg-ink text-white" : "border-black/10"}`}><Icon name={m} size={15} />{m}</button>
            ))}
          </div>
          <textarea className="input mt-3" rows={2} placeholder="Note (optional) — e.g. colour shade used" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <button className="btn-brass mt-3 w-full py-2.5 text-base" disabled={pending} onClick={save}><ReceiptText size={17} /> {pending ? "Saving…" : `Save bill · ${inr(total)}`}</button>
        </section>
      </div>
    </div>
  );
}
