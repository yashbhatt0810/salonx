import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { BookingFlow } from "@/components/BookingFlow";
import { today } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: `Book an appointment · ${s.salon_name}` };
}

export default async function BookPage() {
  const st = await getSettings();
  const sql = db();
  const [services, stylists] = await Promise.all([
    sql`SELECT s.id, s.name, s.price, coalesce(s.duration_min,30) AS duration_min, coalesce(c.name,'Other') AS category FROM services s
        LEFT JOIN service_categories c ON c.id = s.category_id WHERE s.active ORDER BY c.sort NULLS LAST, c.name, s.name`,
    sql`SELECT id, name, designation FROM employees WHERE active AND is_stylist ORDER BY id`,
  ]);
  const days: string[] = [];
  const d0 = new Date(`${today()}T00:00:00`);
  for (let i = 0; i <= st.booking_days; i++) {
    const d = new Date(d0); d.setDate(d0.getDate() + i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <header className="bg-ink">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="font-display text-3xl font-semibold text-white">{st.salon_name}</div>
          <div className="mt-1 text-sm text-white/55">{[st.salon_address, `Open ${st.open_time}–${st.close_time}`].filter(Boolean).join(" · ")}</div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        {!st.booking_enabled ? (
          <div className="card p-8 text-center">
            <div className="font-display text-xl">Online booking is closed right now</div>
            {st.salon_phone && <p className="mt-2 text-sm text-black/60">Please call us at <a className="text-brass-dark underline" href={`tel:${st.salon_phone}`}>{st.salon_phone}</a></p>}
          </div>
        ) : (
          <BookingFlow services={JSON.parse(JSON.stringify(services))} stylists={JSON.parse(JSON.stringify(stylists))} days={days} salonName={st.salon_name} salonPhone={st.salon_phone} />
        )}
        <p className="mt-8 text-center text-xs text-black/45">
          <a href="/terms" className="underline">Terms</a> · <a href="/privacy" className="underline">Privacy</a> · <a href="/consent" className="underline">Consent</a> · Powered by SalonX
        </p>
      </main>
    </div>
  );
}
