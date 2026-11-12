import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "@/lib/actions";
import { Card, Field, PageHeader } from "@/components/ui";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Settings" sub="Salon details shown on bills and WhatsApp messages" />
      {sp.saved && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Saved.</div>}
      <Card className="max-w-2xl">
        <form action={saveSettings} className="grid gap-3 sm:grid-cols-2">
          <Field label="Salon name"><input className="input" name="salon_name" defaultValue={s.salon_name} /></Field>
          <Field label="Phone"><input className="input" name="salon_phone" defaultValue={s.salon_phone} /></Field>
          <Field label="Address" className="sm:col-span-2"><input className="input" name="salon_address" defaultValue={s.salon_address} /></Field>
          <Field label="Bill footer" className="sm:col-span-2"><input className="input" name="bill_footer" defaultValue={s.bill_footer} /></Field>
          <Field label="Remind customers after (days)"><input className="input" type="number" min={7} name="reminder_days" defaultValue={s.reminder_days} /></Field>
          <div className="sm:col-span-2"><button className="btn-primary">Save settings</button></div>
        </form>
      </Card>
      <Card title="Who can log in" className="mt-4 max-w-2xl">
        <ul className="list-disc space-y-1 pl-5 text-sm text-black/65">
          <li><b>Owner</b> — emails in the <code>OWNER_EMAILS</code> variable on Railway. Full access incl. salary & reports.</li>
          <li><b>Manager</b> — staff with access level Manager + “Can login”. Billing, customers, attendance, expenses, purchases.</li>
          <li><b>Barber</b> — staff with “Can login”. Sees only own work, attendance and salary.</li>
        </ul>
      </Card>
    </>
  );
}
