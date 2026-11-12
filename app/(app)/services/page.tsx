import { db } from "@/lib/db";
import { Eye, EyeOff, Pencil, Plus, Save } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { addCategory, deleteCategory, deleteService, renameCategory, saveService, toggleService } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

export default async function Services() {
  await requireAdmin();
  const sql = db();
  const [cats, services] = await Promise.all([
    sql`SELECT * FROM service_categories ORDER BY sort, name`,
    sql`SELECT * FROM services ORDER BY name`,
  ]);
  const groups = [...cats.map((c) => ({ id: c.id as number, name: c.name as string })), { id: 0, name: "No category" }];
  return (
    <>
      <PageHeader icon="services" title="Services" sub={`${cats.length} categories · ${services.length} services`} />
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card icon="list" title="Add category">
          <form action={addCategory} className="flex gap-2">
            <input className="input" name="name" placeholder="e.g. Hair, Beard, Spa, Bridal" required />
            <button className="btn-primary whitespace-nowrap"><Plus size={14} /> Add</button>
          </form>
        </Card>
        <Card icon="services" title="Add service">
          <form action={saveService} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_6rem_5rem_auto]">
            <input className="input col-span-2 sm:col-span-1" name="name" placeholder="Service name" required />
            <select className="input" name="category_id" defaultValue={cats[0]?.id ?? ""}>
              <option value="">No category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" name="price" type="number" min={0} placeholder="₹ Price" required />
            <input className="input" name="duration_min" type="number" min={0} placeholder="Min" />
            <button className="btn-primary"><Plus size={14} /> Add</button>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        {groups.map((g) => {
          const list = services.filter((s) => (s.category_id ?? 0) === g.id);
          if (g.id === 0 && list.length === 0) return null;
          return (
            <Card key={g.id} pad={false}
              title={g.name}
              action={g.id ? (
                <div className="flex items-center gap-1">
                  <form action={renameCategory} className="flex gap-1">
                    <input type="hidden" name="id" value={g.id} />
                    <input className="input w-32 py-1 text-xs" name="name" defaultValue={g.name} />
                    <button className="btn-ghost btn-sm"><Pencil size={13} /> Rename</button>
                  </form>
                  <form action={deleteCategory}><input type="hidden" name="id" value={g.id} /><ConfirmSubmit message="Delete category? Its services move to 'No category'.">Delete</ConfirmSubmit></form>
                </div>
              ) : undefined}
            >
              {list.length === 0 ? <p className="px-4 py-4 text-sm text-black/45">No services in this category.</p> : (
                <div className="divide-y divide-black/5">
                  {list.map((s) => (
                    <div key={s.id} className={`flex flex-wrap items-center gap-2 px-4 py-2 ${s.active ? "" : "opacity-50"}`}>
                      <form action={saveService} className="flex flex-1 flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <input className="input min-w-[10rem] flex-1 py-1" name="name" defaultValue={s.name} />
                        <select className="input w-36 py-1" name="category_id" defaultValue={s.category_id ?? ""}>
                          <option value="">No category</option>
                          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input className="input num w-24 py-1" name="price" type="number" min={0} defaultValue={s.price} />
                        <input className="input num w-20 py-1" name="duration_min" type="number" min={0} defaultValue={s.duration_min ?? ""} placeholder="min" />
                        <button className="btn-ghost btn-sm"><Save size={14} /> Save</button>
                      </form>
                      <form action={toggleService}><input type="hidden" name="id" value={s.id} /><button className="btn-ghost btn-sm">{s.active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}</button></form>
                      <form action={deleteService}><input type="hidden" name="id" value={s.id} /><ConfirmSubmit message="Remove this service? Old bills keep the name.">Remove</ConfirmSubmit></form>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
