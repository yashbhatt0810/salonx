import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "./icons";

export function PageHeader({ title, sub, action, icon }: { title: string; sub?: React.ReactNode; action?: React.ReactNode; icon?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">{icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-brass"><Icon name={icon} size={18} /></span>}{title}</h1>
        {sub && <p className="mt-1 text-sm text-black/55">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Card({ title, icon, action, children, className = "", pad = true }: { title?: string; icon?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3">
          {title && <h2 className="flex items-center gap-2 text-sm font-semibold">{icon && <span className="grid h-6 w-6 place-items-center rounded-md bg-brass-light text-brass-dark"><Icon name={icon} size={14} /></span>}{title}</h2>}
          {action}
        </div>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, icon, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: string; tone?: "default" | "good" | "bad" | "brass" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : tone === "brass" ? "text-brass-dark" : "text-ink";
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-black/50">{label}</span>{icon && <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/[0.04] text-black/55"><Icon name={icon} size={15} /></span>}</div>
      <div className={`num mt-1 text-2xl font-semibold tracking-tight ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-black/45">{hint}</div>}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-black/45">{children}</div>;
}

export function MonthNav({ base, month, label, prev, next, extra = "" }: { base: string; month: string; label: string; prev: string; next: string; extra?: string }) {
  return (
    <div className="flex items-center gap-1">
      <Link className="btn-ghost btn-sm" href={`${base}?month=${prev}${extra}`}><ChevronLeft size={14} /></Link>
      <span className="min-w-[8.5rem] text-center text-sm font-medium">{label}</span>
      <Link className="btn-ghost btn-sm" href={`${base}?month=${next}${extra}`}><ChevronRight size={14} /></Link>
      <input type="hidden" value={month} readOnly />
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="tbl">{children}</table></div>;
}
