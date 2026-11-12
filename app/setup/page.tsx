import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Setup() {
  const clerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const dbOk = Boolean(process.env.DATABASE_URL);
  const owners = Boolean(process.env.OWNER_EMAILS);
  if (clerk && dbOk && owners) redirect("/");
  const Row = ({ ok, label, hint }: { ok: boolean; label: string; hint: string }) => (
    <li className="flex gap-3 border-b border-black/5 py-3 last:border-0">
      <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full text-center text-xs leading-5 text-white ${ok ? "bg-emerald-600" : "bg-black/20"}`}>{ok ? "✓" : ""}</span>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-black/50">{hint}</div>
      </div>
    </li>
  );
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-lg p-6">
        <div className="font-display text-3xl font-semibold">Salon<span className="text-brass">X</span></div>
        <p className="mt-1 text-sm text-black/55">App is deployed. Finish these settings on Railway → Variables to switch on login.</p>
        <ul className="mt-4">
          <Row ok={dbOk} label="Database" hint="DATABASE_URL — linked from the Railway Postgres service" />
          <Row ok={clerk} label="Clerk login" hint="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from a new Clerk application" />
          <Row ok={owners} label="Owner email" hint="OWNER_EMAILS — the email(s) that get full owner access" />
        </ul>
      </div>
    </div>
  );
}
