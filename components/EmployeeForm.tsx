import { saveEmployee } from "@/lib/actions";
import { Field } from "./ui";

type E = { id?: number; name?: string; phone?: string | null; email?: string | null; role?: string; designation?: string | null; monthly_salary?: number; commission_pct?: number; joining_date?: string | null; can_login?: boolean; active?: boolean };

export function EmployeeForm({ e = {}, isOwner }: { e?: E; isOwner: boolean }) {
  return (
    <form action={saveEmployee} className="grid gap-3 sm:grid-cols-2">
      {e.id && <input type="hidden" name="id" value={e.id} />}
      <Field label="Name *"><input className="input" name="name" required defaultValue={e.name ?? ""} /></Field>
      <Field label="Mobile"><input className="input" name="phone" defaultValue={e.phone ?? ""} /></Field>
      <Field label="Designation"><input className="input" name="designation" placeholder="Senior Barber, Helper…" defaultValue={e.designation ?? ""} /></Field>
      <Field label="Joining date"><input className="input" type="date" name="joining_date" defaultValue={e.joining_date ?? ""} /></Field>
      {isOwner && (
        <>
          <Field label="Monthly salary ₹"><input className="input" type="number" min={0} name="monthly_salary" defaultValue={e.monthly_salary ?? 0} /></Field>
          <Field label="Commission % on services"><input className="input" type="number" min={0} max={100} step="0.5" name="commission_pct" defaultValue={e.commission_pct ?? 0} /></Field>
        </>
      )}
      <div className="rounded-xl border border-black/10 p-3 sm:col-span-2">
        <div className="mb-2 text-sm font-semibold">App login</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Login email (same as Clerk sign-in)"><input className="input" type="email" name="email" defaultValue={e.email ?? ""} /></Field>
          {isOwner && (
            <Field label="Access level">
              <select className="input" name="role" defaultValue={e.role ?? "barber"}>
                <option value="barber">Barber — sees only own panel</option>
                <option value="manager">Manager — billing, customers, expenses</option>
              </select>
            </Field>
          )}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="can_login" defaultChecked={e.can_login ?? false} /> Can login</label>
      </div>
      {e.id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={e.active ?? true} /> Currently working (active)</label>}
      <div className="sm:col-span-2"><button className="btn-primary">{e.id ? "Save changes" : "Add staff"}</button></div>
    </form>
  );
}
