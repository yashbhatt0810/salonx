// SalonX "Fig 1 — Hydraulic barber chair". Built with the Anatomy kit (MIT, github.com/wheresryan22/anatomy).
// The idea: today's booked share of the chair's time lifts the chair. One pump of the pedal is one booking;
// the piston rises by the booked fraction, the gauge needle reads the same fraction, and one card sits on the
// spike for every booking. Live values come in through the URL: ?booked=0.62&next=16:30&count=8.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../anatomy/kit/iso-kit.mjs";
import { kitScript } from "../anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "public", "figures");
const theme = process.argv.includes("--dark") ? "dark" : "light";

const WIDTH = 620;
const HEIGHT = 400;

// world units ≈ 1 cm
const PLATE = { x: -92, y: -66, w: 190, d: 128, r: 9 };
const PLATE_H = 6;
const FOOT_H = 4;
const BASE_R = 27;
const HOUSING_R = 9.5;
const HOUSING_TOP = 27;
const SEAT0 = 36; // seat pan underside at rest
const LIFT = 16; // full stroke
const GAUGE = [64, 28];
const GAUGE_R = 15;
const GAUGE_Z = 46;
const GAUGE_H = 7;
const GAUGE_TOP = GAUGE_Z + GAUGE_H;
const SPIKE = [-62, 38];
const CARDS = 12;
const CARD_H = 1.6;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, -26, SEAT0 + LIFT + 82], [0, 46, 0], [GAUGE[0] + GAUGE_R, GAUGE[1], GAUGE_TOP], [-92, 62, 0]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 38 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const near = (a, b) => k.depthOf(a, P) - k.depthOf(b, P); // > 0: a is nearer the viewer
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const FRONT_IS_NEG_Y = near([0, -10, 0], [0, 10, 0]) > 0;
const FRONT_IS_POS_X = near([10, 0, 0], [-10, 0, 0]) > 0;

/* ── floor plinth with tiles ── */
function plinth() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 6.5, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  const tile = k.insetPlan(PLATE, 6);
  out.push(L(k.planOutline(tile, 0, P), { tone: "lo" }));
  const lines = [];
  for (let x = tile.x + 22; x < tile.x + tile.w - 4; x += 22) lines.push(k.lineOnTop([x, tile.y], [x, tile.y + tile.d], 0, P));
  for (let y = tile.y + 22; y < tile.y + tile.d - 4; y += 22) lines.push(k.lineOnTop([tile.x, y], [tile.x + tile.w, y], 0, P));
  out.push(L(lines.join(""), { tone: "faint" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // brass label plate on the front edge with three rule lines
  const label = { x: 34, y: PLATE.y + PLATE.d - 11, w: 30, d: 9, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  for (const [i, w] of [[0, 20], [1, 14], [2, 17]]) out.push(L(k.lineOnTop([label.x + 4, label.y + 2.4 + i * 2.2], [label.x + 4 + w, label.y + 2.4 + i * 2.2], 0.6, P), { tone: "lo", free: "both" }));
  out.push(D([at([label.x + 1.8, label.y + 4.5, 0.6]), at([label.x + label.w - 1.8, label.y + 4.5, 0.6])], { size: 0.42 }));
  return out.join("");
}

/* ── booking spike: one card per booking ── */
function spikeBase() {
  const [x, y] = SPIKE;
  const plan = { x: x - 13, y: y - 10, w: 26, d: 20, r: 2.5 };
  return [
    `<path class="iso-halo" d="${k.haloOf(plan, 0, 0.1, P)}" style="filter:blur(3px)"/>`,
    S(k.slabOf(plan, 0, 4, P, 4, 0.6), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(plan, 2.5), 4, P), { tone: "faint" }),
    D(k.corners(plan, 3).map(([a, b]) => at([a, b, 4])), { size: 0.4 }),
  ].join("");
}
function card(i) {
  const [x, y] = SPIKE;
  const z = 4 + i * CARD_H;
  const plan = { x: x - 10 + ((i * 7) % 3) - 1, y: y - 7 + ((i * 5) % 3) - 1, w: 20, d: 14, r: 0.8 };
  return `<g data-card="${i}" style="display:none">${S(k.slabOf(plan, z, CARD_H - 0.3, P, 2), { tone: "hi", crease: "lo" })}${L(k.lineOnTop([plan.x + 3, plan.y + 4], [plan.x + 13, plan.y + 4], z + CARD_H - 0.3, P), { tone: "lo", free: "both" })}</g>`;
}
function spikeRod() {
  const [x, y] = SPIKE;
  return [
    S(k.cylinder(x, y, 1.1, 4, CARDS * CARD_H + 8, P, 14), { tone: "mid", crease: "none" }),
    S(k.cylinder(x, y, 1.8, 4 + CARDS * CARD_H + 8, 1.6, P, 16), { tone: "mid" }),
  ].join("");
}

/* ── chair base, pedal, hydraulic housing ── */
function chairBase() {
  return [
    `<path class="iso-halo" d="${k.haloOf({ x: -BASE_R, y: -BASE_R, w: BASE_R * 2, d: BASE_R * 2, r: BASE_R }, 0, 0.1, P)}" style="filter:blur(4px)"/>`,
    S(k.cylinder(0, 0, BASE_R, 0, 2.6, P, 64, 0.8), { tone: "mid" }),
    S(k.cylinder(0, 0, BASE_R - 4, 2.6, 2.2, P, 64, 0.6), { tone: "mid" }),
    L(k.ring(0, 0, BASE_R - 8, 4.8, P, 64), { tone: "faint" }),
    D([0, 1, 2, 3].map((i) => { const a = Math.PI / 4 + (i * Math.PI) / 2; return at([Math.cos(a) * (BASE_R - 6), Math.sin(a) * (BASE_R - 6), 4.8]); }), { size: 0.5 }),
  ].join("");
}
function pedalArm() {
  return S(k.slabOf({ x: HOUSING_R - 1, y: -2.5, w: 14, d: 5, r: 1 }, 6, 3, P, 3, 0.4), { tone: "mid" });
}
function pedal() {
  const pad = { x: HOUSING_R + 12, y: -7, w: 16, d: 14, r: 2.5 };
  const out = [S(k.slabOf(pad, 6, 3.4, P, 4, 0.6), { tone: "mid" })];
  const ribs = [];
  for (let y = pad.y + 3; y < pad.y + pad.d - 2; y += 2.6) ribs.push(k.lineOnTop([pad.x + 2.5, y], [pad.x + pad.w - 2.5, y], 9.4, P));
  out.push(L(ribs.join(""), { tone: "lo" }));
  return out.join("");
}
function housing() {
  const out = [];
  out.push(S(k.cylinder(0, 0, HOUSING_R + 2.5, 4.8, 3, P, 40), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, HOUSING_R, 7.8, HOUSING_TOP - 7.8, P, 40), { tone: "mid", crease: "none" }));
  out.push(L([12, 17, 22].map((z) => k.sideArc(0, 0, HOUSING_R, z, P, 24)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, HOUSING_R + 1.4, HOUSING_TOP, 2.4, P, 40, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 6.6, HOUSING_TOP + 2.4, 1.2, P, 32), { tone: "lo" }));
  // release lever on the side
  out.push(S(k.slabOf({ x: -HOUSING_R - 9, y: -1.4, w: 9, d: 2.8, r: 1 }, 20, 2, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(-HOUSING_R - 10, 0, 1.8, 19.6, 2.8, P, 16), { tone: "mid" }));
  return out.join("");
}
/* piston: drawn before the housing so the collar hides its lower end; it is the one lit part */
function piston() {
  return S(k.cylinder(0, 0, 5.2, 12, SEAT0 - 12 + 0.5, P, 32), { tone: "hi", crease: "none", lit: true });
}

/* ── the seat assembly (moves with the lift) ── */
function seat() {
  const out = [];
  const z = SEAT0;
  // swivel plate + chrome pan
  out.push(S(k.cylinder(0, 0, 12, z, 2.4, P, 40), { tone: "mid" }));
  const pan = { x: -27, y: -25, w: 54, d: 48, r: 4 };
  const cushion = { x: -25.5, y: -23.5, w: 51, d: 45, r: 7 };
  const back = { x: -24, y: -26, w: 48, d: 9, r: 4 };
  const head = { x: -13, y: -26, w: 26, d: 7.5, r: 3 };
  const armL = { x: -35, y: -13, w: 8.5, d: 34, r: 3 };
  const armR = { x: 26.5, y: -13, w: 8.5, d: 34, r: 3 };
  const zPan = z + 2.4;
  const zCush = zPan + 2.6;
  const zTop = zCush + 9;

  const armPosts = (arm) => {
    const xs = arm.x + arm.w / 2 - 2;
    return [arm.y + 5, arm.y + arm.d - 9].map((y) => S(k.slabOf({ x: xs, y, w: 4, d: 4, r: 1 }, zPan, 15.5, P, 2, 0.3), { tone: "mid", crease: "none" })).join("");
  };
  const armPad = (arm) => [
    S(k.slabOf(arm, zPan + 15.5, 5.5, P, 6, 0.8), { tone: "hi", crease: "lo" }),
    L(k.planOutline(k.insetPlan(arm, 1.8), zPan + 21, P, 6), { tone: "faint" }),
  ].join("");
  const backrest = () => [
    S(k.slabOf({ x: -19, y: -28.5, w: 38, d: 3, r: 1 }, zPan, 52, P, 2, 0.3), { tone: "mid" }),
    S(k.slabOf(back, zCush + 2, 52, P, 6, 1.2), { tone: "hi", crease: "lo" }),
    L([18, 30, 42].map((h) => k.lineOnTop([back.x + 3, back.y + back.d - 0.2], [back.x + back.w - 3, back.y + back.d - 0.2], zCush + 2 + h, P)).join(""), { tone: "faint" }),
    S(k.cylinder(0, -22, 1.6, zCush + 54, 6, P, 14), { tone: "mid", crease: "none" }),
    S(k.slabOf(head, zCush + 60, 9, P, 5, 1), { tone: "hi", crease: "lo" }),
    L(k.planOutline(k.insetPlan(head, 1.6), zCush + 69, P, 5), { tone: "faint" }),
  ].join("");
  const cushionPart = () => [
    S(k.slabOf(pan, zPan, 2.6, P, 6, 0.5), { tone: "mid" }),
    S(k.slabOf(cushion, zCush, 9, P, 8, 1.6), { tone: "hi", crease: "lo" }),
    L(k.planOutline(k.insetPlan(cushion, 4.5), zTop, P, 8), { tone: "faint" }),
    D([[-17, -15], [17, -15], [-17, 13], [17, 13], [0, -1]].map(([x, y]) => at([x, y, zTop])), { size: 0.45, tone: "lo" }),
  ].join("");
  const footrest = () => {
    const plate = { x: -17, y: 25, w: 34, d: 14, r: 2 };
    const ribs = [];
    for (let x = plate.x + 3.5; x < plate.x + plate.w - 2; x += 3) ribs.push(k.lineOnTop([x, plate.y + 2.5], [x, plate.y + plate.d - 2.5], z - 22, P));
    return [
      S(k.slabOf({ x: -3, y: 19, w: 6, d: 3.5, r: 1 }, z - 22, 24.4, P, 2, 0.3), { tone: "mid", crease: "none" }),
      S(k.slabOf({ x: -3, y: 19, w: 6, d: 9, r: 1 }, z - 25, 3, P, 2, 0.3), { tone: "mid", crease: "none" }),
      S(k.slabOf(plate, z - 25, 3, P, 4, 0.5), { tone: "mid" }),
      L(ribs.join(""), { tone: "lo" }),
      D(k.corners(plate, 2.2).map(([a, b]) => at([a, b, z - 22])), { size: 0.4 }),
    ].join("");
  };

  // painter's order inside the assembly: far side first
  const farArm = FRONT_IS_POS_X ? armL : armR;
  const nearArm = FRONT_IS_POS_X ? armR : armL;
  const parts = [];
  // backrest sits at -y, footrest at +y
  if (!FRONT_IS_NEG_Y) {
    parts.push(backrest(), armPosts(farArm), cushionPart(), armPad(farArm), armPosts(nearArm), armPad(nearArm), footrest());
  } else {
    parts.push(footrest(), armPosts(farArm), cushionPart(), armPad(farArm), armPosts(nearArm), armPad(nearArm), backrest());
  }
  out.push(...parts);
  return out.join("");
}

/* ── booking gauge on a stand ── */
function gauge() {
  const [x, y] = GAUGE;
  const plan = { x: x - 12, y: y - 12, w: 24, d: 24, r: 3 };
  const out = [
    `<path class="iso-halo" d="${k.haloOf(plan, 0, 0.1, P)}" style="filter:blur(3px)"/>`,
    S(k.slabOf(plan, 0, 5, P, 4, 0.6), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(plan, 2.5), 5, P), { tone: "faint" }),
    D(k.corners(plan, 3).map(([a, b]) => at([a, b, 5])), { size: 0.4 }),
    S(k.cylinder(x, y, 2.6, 5, GAUGE_Z - 5, P, 20), { tone: "mid", crease: "none" }),
    L(k.sideArc(x, y, 2.6, 18, P, 12), { tone: "lo" }),
    S(k.cylinder(x, y, GAUGE_R, GAUGE_Z, GAUGE_H, P, 64, 0.7), { tone: "hi", crease: "lo" }),
    L(k.knurl(x, y, GAUGE_R, GAUGE_TOP - 2.6, GAUGE_TOP, 72, P, 0.3), { tone: "lo" }),
    L(k.ring(x, y, GAUGE_R - 2, GAUGE_TOP, P, 64), { tone: "lo" }),
  ];
  // 270° scale from 0 to 100 %
  const from = Math.PI * 0.75, span = Math.PI * 1.5;
  const ticks = k.radialTicks(x, y, GAUGE_R - 2.8, 40, 5, GAUGE_TOP, [1.1, 2.4], P, from, span);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.4, GAUGE_TOP, P, 16), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x - 3.2, y + 7.5], GAUGE_TOP, P, "x"), "% BOOKED", { size: 1.7, tone: "lo" }));
  return out.join("");
}
const NEEDLE_FROM = Math.PI * 0.75;
const NEEDLE_SPAN = Math.PI * 1.5;
const needleAt = (share) => {
  const a = NEEDLE_FROM + NEEDLE_SPAN * Math.max(0, Math.min(1, share));
  const [x, y] = GAUGE;
  return k.lineOnTop([x - Math.cos(a) * 3, y - Math.sin(a) * 3], [x + Math.cos(a) * (GAUGE_R - 3.6), y + Math.sin(a) * (GAUGE_R - 3.6)], GAUGE_TOP + 0.2, P);
};

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A hydraulic barber chair on a tiled plinth. A foot pedal pumps a piston out of the chair's housing; the seat, backrest, armrests and footrest rise with it. Beside it a gauge reads the share of today's chair time that is booked, and a spike holds one card per booking.",
  body: [
    plinth(),
    spikeBase(),
    ...Array.from({ length: CARDS }, (_, i) => card(i)),
    spikeRod(),
    chairBase(),
    pedalArm(),
    `<g data-part="pedal">${pedal()}</g>`,
    `<g data-part="piston">${piston()}</g>`,
    housing(),
    `<g data-part="seat">${seat()}</g>`,
    gauge(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(0)}" style="stroke-width:1.2"/>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const LIFT = ${LIFT}, GAUGE = ${JSON.stringify(GAUGE)}, GAUGE_R = ${GAUGE_R}, GAUGE_TOP = ${GAUGE_TOP};
const NEEDLE_FROM = ${NEEDLE_FROM}, NEEDLE_SPAN = ${NEEDLE_SPAN}, CARDS = ${CARDS};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const seat = svg.querySelector('[data-part="seat"]');
const piston = svg.querySelector('[data-part="piston"]');
const pedal = svg.querySelector('[data-part="pedal"]');
const needle = svg.querySelector('[data-part="needle"]');
const cards = [...svg.querySelectorAll("[data-card]")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const q = new URLSearchParams(location.search);
const live = q.has("booked");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + (h < 12 ? " AM" : " PM"); };
let target = clamp(Number(q.get("booked") || 0), 0, 1);
let count = clamp(Math.round(Number(q.get("count") || 0)), 0, 99);
const next = q.get("next");
const needleAt = ${needleAt.toString().replace("k.lineOnTop", "lineOnTop")};
let share = 0, rate = 0, pump = 0, frame = 0, last = 0, clock = 0, visible = false;
const tour = [0.25, 0.5, 0.8, 0.4];
function text() {
  const pct = Math.round(target * 100) + "% booked";
  if (!live) return pct + " · demo";
  return pct + (count ? " · " + count + " booking" + (count === 1 ? "" : "s") : "") + (next ? " · next free " + fmt(next) : " · fully booked");
}
function draw() {
  const lift = share * LIFT;
  seat.setAttribute("transform", translateAlong(P, [0, 0, lift]));
  piston.setAttribute("transform", translateAlong(P, [0, 0, lift]));
  pedal.setAttribute("transform", translateAlong(P, [0, 0, -2.6 * pump]));
  needle.setAttribute("d", needleAt(share));
  const shown = Math.min(CARDS, Math.round(live ? count * (share / Math.max(target, 0.0001)) : share * 10));
  cards.forEach((c, i) => { const on = i < shown; if ((c.style.display !== "none") !== on) c.style.display = on ? "" : "none"; });
  const t = text();
  if (readout.textContent !== t) readout.textContent = t;
  stage.setAttribute("aria-valuenow", String(Math.round(share * 100)));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now; clock += dt;
  if (!live) target = tour[Math.floor(clock / 3.2) % tour.length];
  if (still.matches) { share = target; rate = 0; pump = 0; }
  else {
    const stiff = 38, drag = 11;
    for (let i = 0; i < 4; i++) { rate += ((target - share) * stiff - rate * drag) * dt / 4; share += rate * dt / 4; }
    const moving = Math.abs(target - share) > 0.004;
    pump = moving ? (Math.sin(clock * 9) * 0.5 + 0.5) : pump * Math.exp(-dt / 0.15);
    if (!moving && Math.abs(rate) < 0.002) { share = target; rate = 0; }
  }
  draw();
  const settled = live && share === target && pump < 0.01;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(stage);
// click or Space: give one pump (a little wobble) so people can feel the hydraulics
const nudge = () => { rate += 0.35; run(); };
stage.addEventListener("click", nudge);
stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); nudge(); } });
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Today's chair",
  hint: "Tap to pump",
  readout: "0% booked",
  keys: [
    { mark: "lit", label: "Piston: rises with the share of today that is booked" },
    { mark: "raised", label: "One card on the spike per booking" },
  ],
  body: `<div class="iso-stage" tabindex="0" role="meter" aria-label="Share of today's chair time that is booked" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}</div>`,
});

let page = k.pageHtml({ title: "Today's chair", theme, body, script: kitScript() + live, width: 640 });
// embedded in an iframe inside SalonX: no page margin, transparent page
page = page.replace(/\.iso-page\{[^}]*\}/, ".iso-page{width:100%;margin:0 auto}").replace("</style>", "html{background:transparent!important;color-scheme:light}body{background:transparent!important}.iso-legend{display:none}</style>");
const file = theme === "light" ? "barber-chair.html" : "barber-chair-dark.html";
writeFileSync(join(OUT, file), page);
console.log("wrote public/figures/" + file, "| front is -y:", FRONT_IS_NEG_Y, "front is +x:", FRONT_IS_POS_X);
