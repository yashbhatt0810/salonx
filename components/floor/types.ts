export type MapSeat = {
  id: number;
  name: string;
  active: boolean;
  x: number;
  y: number;
  rot: number;
  kind: string; // chair | spa | kids
  status: "free" | "busy" | "off";
  who: string | null; // customer / stylist when busy
  bills: number;
  sale: number;
};

export type MapItem = { key: string; id: number | null; kind: string; label: string | null; x: number; y: number; rot: number };

export const ITEM_KINDS: { kind: string; label: string; w: number; d: number }[] = [
  { kind: "reception", label: "Reception desk", w: 1.6, d: 0.6 },
  { kind: "sofa", label: "Waiting sofa", w: 1.8, d: 0.8 },
  { kind: "wash", label: "Hair wash basin", w: 0.7, d: 0.9 },
  { kind: "shelf", label: "Product shelf", w: 1.2, d: 0.35 },
  { kind: "door", label: "Entrance door", w: 1.0, d: 0.15 },
  { kind: "plant", label: "Plant", w: 0.45, d: 0.45 },
  { kind: "mirror", label: "Wall mirror", w: 1.0, d: 0.08 },
];

export const itemSize = (kind: string) => ITEM_KINDS.find((k) => k.kind === kind) ?? { kind, label: kind, w: 0.6, d: 0.6 };

export const SEAT_SIZE = { w: 0.7, d: 0.75 };

export const STATUS_COLOR = { free: "#b8862f", busy: "#7c4dbd", off: "#9a958c" } as const;
