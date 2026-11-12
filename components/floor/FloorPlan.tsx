"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Box, Move, Plus, RotateCcw, RotateCw, Save, Trash2, Undo2 } from "lucide-react";
import { saveFloor } from "@/lib/floor-actions";
import type { MapItem, MapSeat } from "./types";
import { ITEM_KINDS, SEAT_SIZE, STATUS_COLOR, itemSize } from "./types";

const Floor3D = dynamic(() => import("./Floor3D"), {
  ssr: false,
  loading: () => <div className="grid h-[460px] place-items-center rounded-xl bg-[#efe9de] text-sm text-black/45 md:h-[560px]">Loading 3D view…</div>,
});

type Sel = { type: "seat"; id: number } | { type: "item"; key: string } | null;
const snap = (v: number) => Math.round(v * 10) / 10;

function Shape({ roomD, canEdit, x, y, rot, w: sw, d: sd, fill, stroke, label, selected, onDown, children }: {
    roomD: number; canEdit: boolean; x: number; y: number; rot: number; w: number; d: number; fill: string; stroke: string; label: string; selected: boolean;
    onDown: (e: React.PointerEvent) => void; children?: React.ReactNode;
  }) {
  return (
    <g transform={`translate(${x} ${roomD - y}) rotate(${rot})`} onPointerDown={onDown} style={{ cursor: canEdit ? "grab" : "default" }}>
      <rect x={-sw / 2} y={-sd / 2} width={sw} height={sd} rx={0.08} fill={fill} stroke={selected ? "#16151a" : stroke} strokeWidth={selected ? 0.06 : 0.025} />
      {children}
      <text y={sd / 2 + 0.28} textAnchor="middle" fontSize={0.22} fill="#16151a" transform={`rotate(${-rot})`} style={{ pointerEvents: "none", fontWeight: 600 }}>{label}</text>
    </g>
  );
}

export function FloorPlan({ width, depth, seats: initialSeats, items: initialItems, canEdit }: {
  width: number; depth: number; seats: MapSeat[]; items: MapItem[]; canEdit: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"3d" | "edit">("3d");
  const [w, setW] = useState(width);
  const [d, setD] = useState(depth);
  const [seats, setSeats] = useState(initialSeats);
  const [items, setItems] = useState(initialItems);
  const [sel, setSel] = useState<Sel>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ sel: Sel; dx: number; dy: number } | null>(null);

  const pad = 0.4;
  const toPlan = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: d - p.y }; // svg y grows down; plan y grows towards the back wall
  };

  const move = (s: Sel, x: number, y: number) => {
    if (!s) return;
    const cx = Math.min(w, Math.max(0, snap(x)));
    const cy = Math.min(d, Math.max(0, snap(y)));
    if (s.type === "seat") setSeats((l) => l.map((q) => (q.id === s.id ? { ...q, x: cx, y: cy } : q)));
    else setItems((l) => l.map((q) => (q.key === s.key ? { ...q, x: cx, y: cy } : q)));
    setDirty(true);
  };

  const rotate = (delta: number) => {
    if (!sel) return;
    if (sel.type === "seat") setSeats((l) => l.map((q) => (q.id === sel.id ? { ...q, rot: (q.rot + delta + 360) % 360 } : q)));
    else setItems((l) => l.map((q) => (q.key === sel.key ? { ...q, rot: (q.rot + delta + 360) % 360 } : q)));
    setDirty(true);
  };

  const addItem = (kind: string) => {
    const key = `n${Date.now()}`;
    setItems((l) => [...l, { key, id: null, kind, label: null, x: snap(w / 2), y: snap(d / 2), rot: 0 }]);
    setSel({ type: "item", key });
    setDirty(true);
  };

  const removeItem = () => {
    if (sel?.type !== "item") return;
    setItems((l) => l.filter((q) => q.key !== sel.key));
    setSel(null);
    setDirty(true);
  };

  const selSeat = sel?.type === "seat" ? seats.find((s) => s.id === sel.id) : null;
  const selItem = sel?.type === "item" ? items.find((s) => s.key === sel.key) : null;

  function save() {
    setMsg(null);
    start(async () => {
      await saveFloor({
        width: w, depth: d,
        seats: seats.map((s) => ({ id: s.id, x: s.x, y: s.y, rot: s.rot, kind: s.kind })),
        items: items.map((i) => ({ id: i.id, kind: i.kind, label: i.label, x: i.x, y: i.y, rot: i.rot })),
      });
      setDirty(false);
      setMsg("Layout saved");
      router.refresh();
    });
  }

  const startDrag = (s: Sel, px: number, py: number) => (e: React.PointerEvent) => {
    setSel(s);
    if (!canEdit) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toPlan(e.clientX, e.clientY);
    drag.current = { sel: s, dx: px - p.x, dy: py - p.y };
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-black/10 bg-white p-0.5 text-sm">
          <button onClick={() => setTab("3d")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === "3d" ? "bg-ink text-white" : ""}`}><Box size={14} /> 3D view</button>
          {canEdit && <button onClick={() => setTab("edit")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === "edit" ? "bg-ink text-white" : ""}`}><Move size={14} /> Edit layout</button>}
        </div>
        {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
        {msg && !dirty && <span className="text-xs text-emerald-700">{msg}</span>}
        {canEdit && dirty && <button onClick={save} disabled={pending} className="btn-brass ml-auto"><Save size={15} /> {pending ? "Saving…" : "Save layout"}</button>}
      </div>

      {/* Keep the 3D canvas mounted so switching tabs never tears down the WebGL scene mid-render. */}
      <div className={tab === "3d" ? "" : "hidden"}><Floor3D w={w} d={d} seats={seats} items={items} /></div>
      {tab === "edit" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
          <div className="overflow-hidden rounded-xl border border-black/10 bg-[#f3eee5]">
            <svg
              ref={svgRef}
              viewBox={`${-pad} ${-pad} ${w + pad * 2} ${d + pad * 2}`}
              className="h-[460px] w-full touch-none select-none md:h-[540px]"
              onPointerMove={(e) => { if (drag.current) { const p = toPlan(e.clientX, e.clientY); move(drag.current.sel, p.x + drag.current.dx, p.y + drag.current.dy); } }}
              onPointerUp={() => { drag.current = null; }}
              onPointerLeave={() => { drag.current = null; }}
              onPointerDown={() => setSel(null)}
            >
              <defs>
                <pattern id="grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><path d="M 0.5 0 L 0 0 0 0.5" fill="none" stroke="#d8ccb8" strokeWidth="0.01" /></pattern>
              </defs>
              <rect x={0} y={0} width={w} height={d} fill="url(#grid)" stroke="#16151a" strokeWidth={0.08} />
              <text x={w / 2} y={-0.12} textAnchor="middle" fontSize={0.2} fill="#7a6a55">Back wall</text>
              <text x={w / 2} y={d + 0.3} textAnchor="middle" fontSize={0.2} fill="#7a6a55">Front / road side</text>

              {items.map((it) => {
                const sz = itemSize(it.kind);
                const fill = it.kind === "reception" ? "#2a2830" : it.kind === "sofa" ? "#8a7458" : it.kind === "wash" ? "#ffffff" : it.kind === "shelf" ? "#a07e52" : it.kind === "plant" ? "#5f9b6a" : it.kind === "door" ? "#16151a" : "#cfe0ea";
                return (
                  <Shape roomD={d} canEdit={canEdit} key={it.key} x={it.x} y={it.y} rot={it.rot} w={sz.w} d={sz.d} fill={fill} stroke="#7a6a55"
                    label={it.label || sz.label} selected={sel?.type === "item" && sel.key === it.key} onDown={startDrag({ type: "item", key: it.key }, it.x, it.y)} />
                );
              })}
              {seats.map((s) => (
                <Shape roomD={d} canEdit={canEdit} key={s.id} x={s.x} y={s.y} rot={s.rot} w={SEAT_SIZE.w} d={SEAT_SIZE.d} fill={STATUS_COLOR[s.status]} stroke="#16151a"
                  label={s.name} selected={sel?.type === "seat" && sel.id === s.id} onDown={startDrag({ type: "seat", id: s.id }, s.x, s.y)}>
                  {/* backrest (behind) and mirror (in front, facing direction = up at rot 0) */}
                  <rect x={-0.3} y={0.2} width={0.6} height={0.14} rx={0.04} fill="#16151a" style={{ pointerEvents: "none" }} />
                  <rect x={-0.45} y={-0.95} width={0.9} height={0.08} fill="#9cc3d6" stroke="#b8862f" strokeWidth={0.02} style={{ pointerEvents: "none" }} />
                  <path d="M 0 -0.32 L 0.1 -0.18 L -0.1 -0.18 Z" fill="#fff" style={{ pointerEvents: "none" }} />
                </Shape>
              ))}
            </svg>
          </div>

          <div className="space-y-3">
            <div className="card p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/45">Room size (metres)</div>
              <div className="grid grid-cols-2 gap-2">
                <label><span className="label">Width</span><input type="number" step="0.5" min={3} max={40} className="input" value={w} onChange={(e) => { setW(Number(e.target.value) || 3); setDirty(true); }} /></label>
                <label><span className="label">Depth</span><input type="number" step="0.5" min={3} max={40} className="input" value={d} onChange={(e) => { setD(Number(e.target.value) || 3); setDirty(true); }} /></label>
              </div>
            </div>

            <div className="card p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/45">Selected</div>
              {!sel && <p className="text-sm text-black/45">Tap a seat or item on the plan, then drag it to its real place.</p>}
              {selSeat && (
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">{selSeat.name}</div>
                  <select className="input" value={selSeat.kind} onChange={(e) => { setSeats((l) => l.map((q) => (q.id === selSeat.id ? { ...q, kind: e.target.value } : q))); setDirty(true); }}>
                    <option value="chair">Barber chair</option><option value="spa">Spa / facial chair</option><option value="kids">Kids chair</option>
                  </select>
                  <div className="text-xs text-black/45">x {selSeat.x} m · y {selSeat.y} m · facing {selSeat.rot}°</div>
                </div>
              )}
              {selItem && (
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">{itemSize(selItem.kind).label}</div>
                  <input className="input" placeholder="Label (optional)" value={selItem.label ?? ""} onChange={(e) => { setItems((l) => l.map((q) => (q.key === selItem.key ? { ...q, label: e.target.value } : q))); setDirty(true); }} />
                </div>
              )}
              {sel && (
                <div className="mt-2 flex gap-1.5">
                  <button className="btn-ghost btn-sm" onClick={() => rotate(-45)} title="Rotate left"><RotateCcw size={13} /></button>
                  <button className="btn-ghost btn-sm" onClick={() => rotate(45)} title="Rotate right"><RotateCw size={13} /></button>
                  <button className="btn-ghost btn-sm" onClick={() => rotate(180)} title="Turn around"><Undo2 size={13} /></button>
                  {sel.type === "item" && <button className="btn-danger btn-sm ml-auto" onClick={removeItem}><Trash2 size={13} /></button>}
                </div>
              )}
            </div>

            <div className="card p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/45">Add to map</div>
              <div className="grid grid-cols-2 gap-1.5">
                {ITEM_KINDS.map((k) => (
                  <button key={k.kind} onClick={() => addItem(k.kind)} className="flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1.5 text-left text-xs hover:border-brass">
                    <Plus size={12} className="text-brass-dark" /> {k.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-black/45">Seats come from the list below — add a seat there and it appears here.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
