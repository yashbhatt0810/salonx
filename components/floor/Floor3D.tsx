"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import { useState } from "react";
import type { MapItem, MapSeat } from "./types";
import { STATUS_COLOR } from "./types";

const deg = (d: number) => (d * Math.PI) / 180;

type P = { w: number; d: number; seats: MapSeat[]; items: MapItem[] };

/** Position helper: plan (x right, y towards back wall) → scene (x, z), centred. */
function useScene(w: number, d: number) {
  return (x: number, y: number): [number, number, number] => [x - w / 2, 0, d / 2 - y];
}

function BarberChair({ seat, onSelect, selected }: { seat: MapSeat; onSelect: () => void; selected: boolean }) {
  const color = STATUS_COLOR[seat.status];
  const leather = seat.kind === "spa" ? "#2f3e46" : seat.kind === "kids" ? "#c4513d" : "#1d1c21";
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* status ring on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[0.42, selected ? 0.56 : 0.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.95 : 0.7} />
      </mesh>
      {/* base + hydraulic pole */}
      <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[0.3, 0.32, 0.06, 40]} /><meshStandardMaterial color="#c9ccd1" metalness={0.8} roughness={0.25} /></mesh>
      <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.34, 24]} /><meshStandardMaterial color="#d7dade" metalness={0.9} roughness={0.2} /></mesh>
      {/* seat, backrest, headrest */}
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.56, 0.12, 0.52]} /><meshStandardMaterial color={leather} roughness={0.55} /></mesh>
      <mesh position={[0, 0.8, 0.24]} rotation={[deg(-8), 0, 0]} castShadow><boxGeometry args={[0.54, 0.62, 0.11]} /><meshStandardMaterial color={leather} roughness={0.55} /></mesh>
      <mesh position={[0, 1.2, 0.28]} castShadow><boxGeometry args={[0.28, 0.14, 0.08]} /><meshStandardMaterial color={leather} roughness={0.55} /></mesh>
      {/* armrests with chrome */}
      {[-0.31, 0.31].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.6, 0.02]} castShadow><boxGeometry args={[0.08, 0.07, 0.46]} /><meshStandardMaterial color={leather} roughness={0.55} /></mesh>
          <mesh position={[x, 0.52, -0.15]}><cylinderGeometry args={[0.015, 0.015, 0.14, 12]} /><meshStandardMaterial color="#d7dade" metalness={0.9} roughness={0.2} /></mesh>
        </group>
      ))}
      {/* footrest */}
      <mesh position={[0, 0.2, -0.4]} castShadow><boxGeometry args={[0.42, 0.04, 0.18]} /><meshStandardMaterial color="#c9ccd1" metalness={0.8} roughness={0.25} /></mesh>
      {/* station: counter + mirror in front of the chair */}
      <mesh position={[0, 0.85, -0.82]} castShadow receiveShadow><boxGeometry args={[0.95, 0.06, 0.38]} /><meshStandardMaterial color="#f3ede3" roughness={0.6} /></mesh>
      <mesh position={[0, 0.42, -0.9]} castShadow><boxGeometry args={[0.85, 0.8, 0.22]} /><meshStandardMaterial color="#2a2830" roughness={0.7} /></mesh>
      <mesh position={[0, 1.55, -0.99]}><boxGeometry args={[0.95, 1.25, 0.04]} /><meshStandardMaterial color="#b8862f" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 1.55, -0.965]}><planeGeometry args={[0.85, 1.15]} /><meshStandardMaterial color="#c3d8e4" metalness={0.15} roughness={0.12} emissive="#9fbccc" emissiveIntensity={0.25} /></mesh>
      <Html position={[0, 1.95, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
        <div onClick={onSelect} className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg ${selected ? "ring-2 ring-white" : ""}`} style={{ background: color }}>
          {seat.name}{seat.status === "busy" ? " · Busy" : seat.status === "off" ? " · Off" : ""}
        </div>
      </Html>
    </group>
  );
}

function Item({ item }: { item: MapItem }) {
  switch (item.kind) {
    case "reception":
      return (
        <group>
          <mesh position={[0, 0.52, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 1.04, 0.6]} /><meshStandardMaterial color="#16151a" roughness={0.6} /></mesh>
          <mesh position={[0, 1.06, 0.05]} castShadow><boxGeometry args={[1.7, 0.05, 0.75]} /><meshStandardMaterial color="#b8862f" metalness={0.4} roughness={0.4} /></mesh>
          <mesh position={[0.4, 1.2, 0.05]}><boxGeometry args={[0.35, 0.22, 0.02]} /><meshStandardMaterial color="#333" /></mesh>
          <Label text={item.label || "Reception"} y={1.6} />
        </group>
      );
    case "sofa":
      return (
        <group>
          <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[1.8, 0.4, 0.8]} /><meshStandardMaterial color="#6b5a45" roughness={0.9} /></mesh>
          <mesh position={[0, 0.6, 0.32]} castShadow><boxGeometry args={[1.8, 0.45, 0.18]} /><meshStandardMaterial color="#6b5a45" roughness={0.9} /></mesh>
          {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.42, 0]} castShadow><boxGeometry args={[0.14, 0.3, 0.8]} /><meshStandardMaterial color="#5a4a38" roughness={0.9} /></mesh>)}
          <Label text={item.label || "Waiting"} y={1.2} />
        </group>
      );
    case "wash":
      return (
        <group>
          <mesh position={[0, 0.42, 0.15]} castShadow><boxGeometry args={[0.7, 0.84, 0.5]} /><meshStandardMaterial color="#f5f5f2" roughness={0.4} /></mesh>
          <mesh position={[0, 0.88, 0.15]}><cylinderGeometry args={[0.26, 0.2, 0.12, 32]} /><meshStandardMaterial color="#1d1c21" roughness={0.3} /></mesh>
          <mesh position={[0, 0.42, -0.3]} castShadow><boxGeometry args={[0.6, 0.3, 0.55]} /><meshStandardMaterial color="#1d1c21" roughness={0.55} /></mesh>
          <Label text={item.label || "Hair wash"} y={1.4} />
        </group>
      );
    case "shelf":
      return (
        <group>
          <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[1.2, 1.8, 0.35]} /><meshStandardMaterial color="#8a6a43" roughness={0.8} /></mesh>
          {[0.45, 0.95, 1.45].map((y) => (
            <group key={y}>{[-0.4, -0.15, 0.1, 0.35].map((x, i) => <mesh key={x} position={[x, y, -0.05]}><cylinderGeometry args={[0.05, 0.05, 0.22, 12]} /><meshStandardMaterial color={["#b8862f", "#2f7cb8", "#c4513d", "#2f9e6e"][i]} /></mesh>)}</group>
          ))}
          <Label text={item.label || "Products"} y={2.1} />
        </group>
      );
    case "plant":
      return (
        <group>
          <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.18, 0.14, 0.4, 24]} /><meshStandardMaterial color="#e8e2d6" /></mesh>
          <mesh position={[0, 0.75, 0]} castShadow><sphereGeometry args={[0.32, 20, 16]} /><meshStandardMaterial color="#3f7d4a" roughness={0.9} /></mesh>
        </group>
      );
    case "door":
      return (
        <group>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.0, 0.7]} /><meshStandardMaterial color="#7a6a55" /></mesh>
          {[-0.52, 0.52].map((x) => <mesh key={x} position={[x, 1.05, 0]}><boxGeometry args={[0.06, 2.1, 0.12]} /><meshStandardMaterial color="#16151a" /></mesh>)}
          <mesh position={[0, 2.12, 0]}><boxGeometry args={[1.1, 0.08, 0.12]} /><meshStandardMaterial color="#16151a" /></mesh>
          <Label text={item.label || "Entrance"} y={2.5} />
        </group>
      );
    case "mirror":
      return (
        <group>
          <mesh position={[0, 1.4, 0]}><boxGeometry args={[1.0, 1.4, 0.05]} /><meshStandardMaterial color="#b8862f" metalness={0.6} roughness={0.35} /></mesh>
          <mesh position={[0, 1.4, -0.03]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.9, 1.3]} /><meshStandardMaterial color="#c3d8e4" metalness={0.15} roughness={0.12} emissive="#9fbccc" emissiveIntensity={0.25} /></mesh>
        </group>
      );
    default:
      return null;
  }
}

function Label({ text, y }: { text: string; y: number }) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={9} zIndexRange={[10, 0]}>
      <div className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/70 shadow">{text}</div>
    </Html>
  );
}

export default function Floor3D({ w, d, seats, items }: P) {
  const at = useScene(w, d);
  const [sel, setSel] = useState<number | null>(null);
  const selected = seats.find((s) => s.id === sel) ?? null;
  const wallH = 2.8;
  const size = Math.max(w, d);

  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#efe9de] to-[#d9d0c1] md:h-[560px]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [w * 0.15, size * 0.95, size * 1.05], fov: 42 }} onPointerMissed={() => setSel(null)}>
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#fff8ec", "#8a7a66", 0.5]} />
        <directionalLight position={[w * 0.4, 7, d * 0.6]} intensity={1.15} castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-size} shadow-camera-right={size} shadow-camera-top={size} shadow-camera-bottom={-size} />

        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#e7dccb" roughness={0.85} />
        </mesh>
        <gridHelper args={[size, Math.round(size * 2), "#cdbfa8", "#ddd2c0"]} position={[0, 0.002, 0]} />

        {/* walls: back, left, right (front is open so you can look in) */}
        <mesh position={[0, wallH / 2, -d / 2 - 0.05]} receiveShadow><boxGeometry args={[w + 0.2, wallH, 0.1]} /><meshStandardMaterial color="#f7f3ec" /></mesh>
        <mesh position={[-w / 2 - 0.05, wallH / 2, 0]} receiveShadow><boxGeometry args={[0.1, wallH, d]} /><meshStandardMaterial color="#efe8dc" /></mesh>
        <mesh position={[w / 2 + 0.05, wallH / 2, 0]} receiveShadow><boxGeometry args={[0.1, wallH, d]} /><meshStandardMaterial color="#efe8dc" /></mesh>
        <mesh position={[0, 0.06, -d / 2 + 0.01]}><boxGeometry args={[w, 0.12, 0.03]} /><meshStandardMaterial color="#16151a" /></mesh>
        {/* low front edge marker */}
        <mesh position={[0, 0.02, d / 2]}><boxGeometry args={[w, 0.04, 0.04]} /><meshStandardMaterial color="#b8862f" /></mesh>

        {items.map((it) => {
          const [x, , z] = at(it.x, it.y);
          return <group key={it.key} position={[x, 0, z]} rotation={[0, deg(-it.rot), 0]}><Item item={it} /></group>;
        })}
        {seats.map((s) => {
          const [x, , z] = at(s.x, s.y);
          return (
            <group key={s.id} position={[x, 0, z]} rotation={[0, deg(-s.rot), 0]}>
              <BarberChair seat={s} selected={sel === s.id} onSelect={() => setSel(s.id)} />
            </group>
          );
        })}

        <ContactShadows position={[0, 0.003, 0]} scale={size * 1.5} opacity={0.35} blur={2.4} far={3} />
        <OrbitControls makeDefault enablePan target={[0, 0.6, 0]} maxPolarAngle={Math.PI / 2.15} minDistance={3} maxDistance={size * 3} />
      </Canvas>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5 text-[11px]">
        {(["free", "busy", "off"] as const).map((k) => (
          <span key={k} className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 shadow-sm">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[k] }} />{k === "free" ? "Free" : k === "busy" ? "In service" : "Off"}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/55 px-2.5 py-1 text-[11px] text-white">Drag to rotate · scroll / pinch to zoom · right-drag to move</div>

      {selected && (
        <div className="absolute right-3 top-3 w-56 rounded-xl bg-white p-3 text-sm shadow-xl">
          <div className="flex items-center justify-between"><b>{selected.name}</b>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: STATUS_COLOR[selected.status] }}>
              {selected.status === "free" ? "Free" : selected.status === "busy" ? "In service" : "Off"}
            </span>
          </div>
          {selected.who && <div className="mt-1 text-xs text-black/60">{selected.who}</div>}
          <div className="mt-2 flex justify-between text-xs"><span className="text-black/50">Today</span><span>{selected.bills} bills · ₹{selected.sale.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-xs"><span className="text-black/50">Type</span><span className="capitalize">{selected.kind === "chair" ? "Barber chair" : selected.kind === "spa" ? "Spa chair" : "Kids chair"}</span></div>
        </div>
      )}
    </div>
  );
}
