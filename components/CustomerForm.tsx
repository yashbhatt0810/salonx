import { saveCustomer } from "@/lib/actions";
import { Field } from "./ui";

type C = { id?: number; name?: string; phone?: string | null; gender?: string | null; dob?: string | null; anniversary?: string | null; address?: string | null; notes?: string | null };

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
      <div className="sm:col-span-2"><button className="btn-primary">{c.id ? "Save changes" : "Add customer"}</button></div>
    </form>
  );
}
