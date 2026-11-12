"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./Shell";
import { Icon } from "./icons";

export function NavLinks({ groups }: { groups: { group: string; items: NavItem[] }[] }) {
  const path = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3">
      {groups.map((g) => (
        <div key={g.group} className="mb-4">
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{g.group}</div>
          {g.items.map((i) => {
            const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={(e) => (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open")}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition ${active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon name={i.icon} size={16} className={active ? "text-brass" : ""} />
                {i.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
