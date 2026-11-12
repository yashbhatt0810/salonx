"use client";
import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function CopyLink({ path, label = "Copy booking link" }: { path: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        try { await navigator.clipboard.writeText(url); } catch { prompt("Copy this link", url); }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? <Check size={15} /> : <Link2 size={15} />} {done ? "Copied" : label}
    </button>
  );
}
