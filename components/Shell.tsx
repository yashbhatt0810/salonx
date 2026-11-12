import Link from "next/link";
import { Menu } from "lucide-react";
import type { Me } from "@/lib/auth";
import { UserBox } from "./UserBox";
import { NavLinks } from "./NavLinks";

export type NavItem = { href: string; label: string; icon: string; owner?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Daily", items: [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/appointments", label: "Appointments", icon: "calendar" },
    { href: "/billing", label: "New Bill", icon: "bill" },
    { href: "/visits", label: "Bills", icon: "bills" },
    { href: "/customers", label: "Customers", icon: "customers" },
    { href: "/attendance", label: "Attendance", icon: "attendance" },
  ]},
  { group: "Money", items: [
    { href: "/expenses", label: "Expenses", icon: "expenses" },
    { href: "/purchases", label: "Purchases & Stock", icon: "purchases" },
    { href: "/salary", label: "Salary Sheet", icon: "salary", owner: true },
    { href: "/commission", label: "Commission", icon: "commission", owner: true },
    { href: "/reports", label: "Reports", icon: "reports", owner: true },
  ]},
  { group: "Setup", items: [
    { href: "/staff", label: "Staff", icon: "staff" },
    { href: "/services", label: "Services", icon: "services" },
    { href: "/seats", label: "Seats", icon: "seats" },
    { href: "/settings", label: "Settings", icon: "settings", owner: true },
  ]},
];

export function Shell({ me, salonName, children }: { me: Me; salonName: string; children: React.ReactNode }) {
  const groups =
    me.role === "barber"
      ? [{ group: "My work", items: [
          { href: "/me", label: "My Panel", icon: "me" },
          { href: "/me/commission", label: "My Commission", icon: "commission" },
          { href: "/me/slip", label: "Salary Slip", icon: "slip" },
        ] }]
      : NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.owner || me.role === "owner") }));
  const side = (
    <div className="flex h-full flex-col">
      <Link href="/" className="block px-5 pb-5 pt-6">
        <div className="font-display text-2xl font-semibold text-white">Salon<span className="text-brass">X</span></div>
        <div className="mt-0.5 truncate text-xs text-white/50">{salonName}</div>
      </Link>
      <NavLinks groups={groups} />
      <div className="flex gap-3 px-5 pb-2 text-[11px] text-white/40">
        <Link href="/terms" className="hover:text-white/70">Terms</Link>
        <Link href="/privacy" className="hover:text-white/70">Privacy</Link>
        <Link href="/consent" className="hover:text-white/70">Consent</Link>
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <UserBox name={me.name} role={me.role} clerk={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} />
      </div>
    </div>
  );
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 bg-ink md:block print:!hidden">{side}</aside>
      <details className="group sticky top-0 z-30 bg-ink md:hidden print:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="font-display text-xl font-semibold text-white">Salon<span className="text-brass">X</span></span>
          <span className="flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1 text-sm text-white"><Menu size={15} /> Menu</span>
        </summary>
        <div className="max-h-[80vh] overflow-y-auto pb-2">{side}</div>
      </details>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 print:p-0">{children}</main>
    </div>
  );
}
