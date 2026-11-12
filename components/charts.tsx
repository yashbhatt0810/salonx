"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const BRASS = "#b8862f";
const INK = "#16151a";
const PALETTE = ["#b8862f", "#16151a", "#2f7cb8", "#2f9e6e", "#9b4fb8", "#c4513d"];
const inr = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");
const short = (v: number) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v)));

const tipStyle = { borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: 12 };

export function SalesTrend({ data }: { data: { day: string; sale: number; bills: number; avg: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gSale" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRASS} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BRASS} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} tickFormatter={short} />
        <Tooltip contentStyle={tipStyle} formatter={(v, n) => [n === "bills" ? v : inr(Number(v)), n === "sale" ? "Sale" : n === "avg" ? "Last-30 avg" : "Bills"]} />
        <Area type="monotone" dataKey="sale" stroke={BRASS} strokeWidth={2.2} fill="url(#gSale)" dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="avg" stroke={INK} strokeOpacity={0.35} strokeDasharray="4 4" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HourBars({ data, peak }: { data: { hour: string; visits: number }[]; peak: string | null }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(184,134,47,0.08)" }} formatter={(v) => [v, "Customers"]} />
        <Bar dataKey="visits" radius={[6, 6, 0, 0]}>
          {data.map((d) => <Cell key={d.hour} fill={d.hour === peak ? BRASS : "#d9cdb5"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeekdayBars({ data }: { data: { day: string; sale: number }[] }) {
  const max = Math.max(...data.map((d) => d.sale), 0);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} tickFormatter={short} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(184,134,47,0.08)" }} formatter={(v) => [inr(Number(v)), "Avg sale"]} />
        <Bar dataKey="sale" radius={[6, 6, 0, 0]}>
          {data.map((d) => <Cell key={d.day} fill={d.sale === max && max > 0 ? INK : "#cfc6b6"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.length ? data : [{ name: "None", value: 1 }]} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={data.length > 1 ? 3 : 0} stroke="none">
              {(data.length ? data : [{ name: "None", value: 1 }]).map((d, i) => <Cell key={d.name} fill={data.length ? PALETTE[i % PALETTE.length] : "#eee"} />)}
            </Pie>
            {data.length > 0 && <Tooltip contentStyle={tipStyle} formatter={(v) => inr(Number(v))} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wider text-black/40">Total</span>
          <span className="num text-sm font-semibold">{inr(total)}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{d.name}</span>
            <span className="num text-black/60">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-black/45">No sales yet.</p>}
      </div>
    </div>
  );
}

export function StaffBars({ data }: { data: { name: string; sale: number; services: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: INK }} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(184,134,47,0.08)" }} formatter={(v, n) => [n === "sale" ? inr(Number(v)) : v, n === "sale" ? "Sale" : "Services"]} />
        <Bar dataKey="sale" radius={[0, 8, 8, 0]} barSize={18}>
          {data.map((d, i) => <Cell key={d.name} fill={i === 0 ? BRASS : "#d9cdb5"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CommissionBars({ data }: { data: { day: string; sale: number; commission: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} interval="preserveStartEnd" minTickGap={10} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.45)" }} tickFormatter={short} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(184,134,47,0.08)" }} formatter={(v, n) => [inr(Number(v)), n === "commission" ? "Commission" : "Sale"]} />
        <Bar dataKey="commission" fill={BRASS} radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
