import { saveCustomer } from "@/lib/actions";
import { Save, UserPlus } from "lucide-react";
import { Field } from "./ui";

type C = { whatsapp_consent?: boolean; consent_at?: string | Date | null; id?: number; name?: string; phone?: string | null; gender?: string | null; dob?: string | null; anniversary?: string | null; address?: string | null; notes?: string | null };

export function CustomerForm({ c = {} }: { c?: C }) {
  return (
    <form action={saveCustomer} className="grid gap-3 sm:grid-cols-2">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <Field label="Name *"><input className="input" name="name" required defaultValue={c.name ?? ""} /></Field>
      <Field label="Mobile"><input className="input" name="phone" inputMode="tel" defaultValue={c.phone ?? ""} /></Field>
      <Field label="Gender">
        <select className="input" name="gender" defaultValue={c.gender ?? ""}>
          <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
        </select>
      </Field>
      <Field label="Birthday"><input className="input" type="date" name="dob" defaultValue={c.dob ?? ""} /></Field>
      <Field label="Anniversary"><input className="input" type="date" name="anniversary" defaultValue={c.anniversary ?? ""} /></Field>
      <Field label="Address / Area"><input className="input" name="address" defaultValue={c.address ?? ""} /></Field>
      <Field label="Notes (hair type, preferences, allergies…)" className="sm:col-span-2"><textarea className="input" rows={2} name="notes" defaultValue={c.notes ?? ""} /></Field>
      <label className="flex items-start gap-2 rounded-xl border border-black/10 p-3 text-sm sm:col-span-2">
        <input type="checkbox" name="whatsapp_consent" className="mt-0.5" defaultChecked={c.whatsapp_consent ?? false} />
        <span>
          Customer agrees to receive WhatsApp / SMS messages — bills, reminders, birthday wishes and offers.
          <a href="/consent" target="_blank" className="ml-1 text-brass-dark underline">Read consent</a>
          {c.consent_at && <span className="block text-xs text-black/45">Consent recorded on {new Date(c.consent_at).toLocaleDateString("en-IN")}</span>}
        </span>
      </label>
      <div className="sm:col-span-2"><button className="btn-primary">{c.id ? <><Save size={14} /> Save changes</> : <><UserPlus size={14} /> Add customer</>}</button></div>
    </form>
  );
}
