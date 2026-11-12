"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin } from "./auth";

export type FloorSeat = { id: number; x: number; y: number; rot: number; kind: string };
export type FloorItem = { id: number | null; kind: string; label: string | null; x: number; y: number; rot: number };

const KINDS = ["reception", "sofa", "wash", "door", "shelf", "plant", "mirror"];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

export async function saveFloor(input: { width: number; depth: number; seats: FloorSeat[]; items: FloorItem[] }) {
  await requireAdmin();
  const w = clamp(input.width, 3, 40);
  const d = clamp(input.depth, 3, 40);
  const sql = db();
  await sql.begin(async (tx) => {
    for (const [k, v] of [["floor_w", w], ["floor_d", d]] as const)
      await tx`INSERT INTO settings (key, value) VALUES (${k}, ${String(v)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    for (const s of input.seats) {
      await tx`UPDATE seats SET pos_x = ${clamp(s.x, 0, w)}, pos_y = ${clamp(s.y, 0, d)}, rot = ${Math.round(s.rot) % 360},
        kind = ${["chair", "spa", "kids"].includes(s.kind) ? s.kind : "chair"} WHERE id = ${s.id}`;
    }
    const keep = input.items.filter((i) => i.id).map((i) => i.id as number);
    if (keep.length) await tx`DELETE FROM floor_items WHERE id NOT IN ${tx(keep)}`;
    else await tx`DELETE FROM floor_items`;
    for (const i of input.items) {
      if (!KINDS.includes(i.kind)) continue;
      const row = { kind: i.kind, label: i.label?.slice(0, 40) || null, pos_x: clamp(i.x, 0, w), pos_y: clamp(i.y, 0, d), rot: Math.round(i.rot) % 360 };
      if (i.id) await tx`UPDATE floor_items SET ${tx(row)} WHERE id = ${i.id}`;
      else await tx`INSERT INTO floor_items ${tx(row)}`;
    }
  });
  revalidatePath("/seats");
  return { ok: true };
}
