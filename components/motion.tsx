"use client";

/**
 * SalonX motion layer, built on anime.js v4 (https://github.com/juliangarnier/anime).
 * Rules: short (≤ 700 ms), eased out, never blocks input, and fully off under prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { animate, stagger } from "animejs";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Staggers cards, stat tiles and list rows in on every route change inside `<main>`. */
export function PageMotion({ selector = ".card" }: { selector?: string }) {
  const path = usePathname();
  useEffect(() => {
    if (reduced()) return;
    const main = document.querySelector("main") ?? document.body;
    const els = Array.from(main.querySelectorAll<HTMLElement>(selector)).filter((el) => el.offsetParent !== null).slice(0, 40);
    if (!els.length) return;
    const a = animate(els, {
      opacity: [0, 1],
      translateY: [14, 0],
      scale: [0.985, 1],
      duration: 520,
      delay: stagger(45),
      ease: "outExpo",
      onComplete: () => els.forEach((el) => { el.style.transform = ""; el.style.opacity = ""; }),
    });
    return () => { a.revert(); };
  }, [path, selector]);
  return null;
}

/** Counts a displayed number up from zero, keeping its prefix/suffix and Indian grouping (₹1,23,400). */
export function CountUp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    const m = text.match(/^(\D*?)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!m || /\d/.test(m[3])) return; // only simple "prefix number suffix" values
    const [, pre, num, post] = m;
    const target = Number(num.replace(/,/g, ""));
    if (!Number.isFinite(target) || target === 0) return;
    const decimals = (num.split(".")[1] ?? "").length;
    const state = { v: 0 };
    const fmt = (v: number) => pre + v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post;
    el.textContent = fmt(0);
    const a = animate(state, {
      v: target,
      duration: 900,
      ease: "outExpo",
      onUpdate: () => { el.textContent = fmt(decimals ? state.v : Math.round(state.v)); },
      onComplete: () => { el.textContent = text; },
    });
    return () => { a.pause(); el.textContent = text; };
  }, [text]);
  return <span ref={ref}>{text}</span>;
}

/** Tiny spring "press" on any button or link inside the app. */
export function PressFeedback() {
  useEffect(() => {
    if (reduced()) return;
    const down = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".btn, .btn-primary, .btn-brass, .btn-ghost, .btn-danger");
      if (!el || el.hasAttribute("disabled")) return;
      animate(el, { scale: [1, 0.96, 1], duration: 260, ease: "outBack(2)" });
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, []);
  return null;
}

/** Pops an element in once (used for success states). */
export function PopIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || reduced()) return;
    const a = animate(ref.current, { scale: [0.6, 1], opacity: [0, 1], rotate: [-8, 0], duration: 700, ease: "outElastic(1, .6)" });
    return () => { a.revert(); };
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
