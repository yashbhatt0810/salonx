import Link from "next/link";
import { ArrowLeft, FileText, Lock, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/terms", label: "Terms & Conditions", Icon: FileText },
    { href: "/privacy", label: "Privacy Policy", Icon: Lock },
    { href: "/consent", label: "Consent", Icon: ShieldCheck },
  ];
  return (
    <div className="min-h-screen">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="font-display text-2xl font-semibold text-white">Salon<span className="text-brass">X</span></Link>
          <nav className="flex flex-wrap gap-1">
            {links.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
                <Icon size={14} /> {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {children}
        <div className="mt-8 print:hidden">
          <Link href="/" className="btn-ghost"><ArrowLeft size={15} /> Back to SalonX</Link>
        </div>
      </main>
    </div>
  );
}
