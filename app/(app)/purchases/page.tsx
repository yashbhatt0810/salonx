import { db } from "@/lib/db";
import { PackageMinus, Plus, Save } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { addPurchase, addUsage, deleteItem, deletePurchase, deleteUsage, saveItem } from "@/lib/actions";
import { Card, Empty, MonthNav, PageHeader, Table } from "@/components/ui";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { PAYMENT_MODES, fmtDate, inr, monthLabel, monthRange, shiftMonth, thisMonth, today } from "@/lib/utils";

export default async function Purchases({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth();
  const { start, end } = monthRange(month);
  const sql = db();
  const [items, purchases, usage] = await Promise.all([
    sql`SELECT i.*,
          coalesce((SELECT sum(qty) FROM purchases WHERE item_id = i.id),0) AS bought,
          coalesce((SELECT sum(qty) FROM stock_usage WHERE item_id = i.id),0) AS used,
          (SELECT rate FROM purchases WHERE item_id = i.id ORDER BY date DESC, id DESC LIMIT 1) AS last_rate
        FROM purchase_items i ORDER BY i.name`,
    sql`SELECT p.*, i.name, i.unit FROM purchases p JOIN purchase_items i ON i.id = p.item_id WHERE p.date BETWEEN ${start} AND ${end} ORDER BY p.date DESC, p.id DESC`,
    sql`SELECT u.*, i.name, i.unit FROM stock_usage u JOIN purchase_items i ON i.id = u.item_id WHERE u.date BETWEEN ${start} AND ${end} ORDER BY u.date DESC, u.id DESC`,
  ]);
  const total = purchases.reduce((a, p) => a + Number(p.amount), 0);
  const itemOpts = items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>);
  return (
    <>
      <PageHeader icon="purchases" title="Purchases & Stock" sub={`${monthLabel(month)} purchases: ${inr(total)}`}
        action={<MonthNav base="/purchases" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card icon="purchases" title="Add purchase">
          {items.length === 0 ? <p className="text-sm text-black/50">First add an item below (shampoo, blades, colour…).</p> : (
            <form action={addPurchase} className="grid grid-cols-2 gap-2">
              <label className="col-span-2"><span className="label">Item</span><select className="input" name="item_id" required>{itemOpts}</select></label>
              <label><span className="label">Qty</span><input className="input" type="number" step="0.01" min={0.01} name="qty" required /></label>
              <label><span className="label">Rate ₹</span><input className="input" type="number" step="0.01" min={0} name="rate" required /></label>
              <label><span className="label">Vendor</span><input className="input" name="vendor" /></label>
              <label><span className="label">Date</span><input className="input" type="date" name="date" defaultValue={today()} /></label>
              <label><span className="label">Paid by</span><select className="input" name="payment_mode">{PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
              <label><span className="label">Bill amount ₹</span><input className="input" type="number" step="0.01" name="amount" placeholder="auto = qty × rate" /></label>
              <button className="btn-primary col-span-2"><Plus size={14} /> Add purchase</button>
            </form>
          )}
        </Card>
        <Card icon="clipboard" title="Use stock (consumed in salon)">
          {items.length === 0 ? <p className="text-sm text-black/50">No items yet.</p> : (
            <form action={addUsage} className="grid grid-cols-2 gap-2">
              <label className="col-span-2"><span className="label">Item</span><select className="input" name="item_id" required>{itemOpts}</select></label>
              <label><span className="label">Qty used</span><input className="input" type="number" step="0.01" min={0.01} name="qty" required /></label>
              <label><span className="label">Date</span><input className="input" type="date" name="date" defaultValue={today()} /></label>
              <label className="col-span-2"><span className="label">Note</span><input className="input" name="note" /></label>
              <button className="btn-ghost col-span-2"><PackageMinus size={14} /> Record usage</button>
            </form>
          )}
        </Card>
        <Card icon="tag" title="Add item">
          <form action={saveItem} className="grid grid-cols-2 gap-2">
            <label className="col-span-2"><span className="label">Item name</span><input className="input" name="name" required placeholder="e.g. Shaving cream 500ml" /></label>
            <label><span className="label">Unit</span><input className="input" name="unit" defaultValue="pcs" /></label>
            <label><span className="label">Category</span><input className="input" name="category" placeholder="Consumable / Retail" /></label>
            <label className="col-span-2"><span className="label">Low-stock alert at</span><input className="input" type="number" step="0.01" min={0} name="min_stock" defaultValue={0} /></label>
            <button className="btn-primary col-span-2"><Plus size={14} /> Add item</button>
          </form>
        </Card>
      </div>

      <Card icon="purchases" title="Items & current stock" pad={false} className="mt-4">
        {items.length === 0 ? <Empty>No items yet.</Empty> : (
          <Table>
            <thead><tr><th>Item</th><th>Unit</th><th>Category</th><th className="text-right">Bought</th><th className="text-right">Used</th><th className="text-right">In stock</th><th className="text-right">Last rate</th><th>Alert at</th><th></th></tr></thead>
            <tbody>
              {items.map((i) => {
                const stock = Number(i.bought) - Number(i.used);
                const low = Number(i.min_stock) > 0 && stock <= Number(i.min_stock);
                return (
                  <tr key={i.id}>
                    <td colSpan={3} className="p-0">
                      <form action={saveItem} id={`item-${i.id}`} className="grid grid-cols-[2fr_1fr_1.3fr] gap-1 px-3 py-1.5">
                        <input type="hidden" name="id" value={i.id} />
                        <input className="input py-1" name="name" defaultValue={i.name} />
                        <input className="input py-1" name="unit" defaultValue={i.unit} />
                        <input className="input py-1" name="category" defaultValue={i.category ?? ""} />
                      </form>
                    </td>
                    <td className="num text-right">{Number(i.bought)}</td>
                    <td className="num text-right">{Number(i.used)}</td>
                    <td className={`num text-right font-semibold ${low ? "text-red-700" : ""}`}>{stock}{low && " ⚠"}</td>
                    <td className="num text-right text-black/60">{i.last_rate != null ? inr(i.last_rate) : "—"}</td>
                    <td><input form={`item-${i.id}`} className="input num w-20 py-1" type="number" step="0.01" name="min_stock" defaultValue={i.min_stock} /></td>
                    <td className="whitespace-nowrap text-right">
                      <button form={`item-${i.id}`} className="btn-ghost btn-sm"><Save size={14} /> Save</button>
                      <form action={deleteItem} className="inline"><input type="hidden" name="id" value={i.id} /><ConfirmSubmit message="Remove item with all its purchase history?">✕</ConfirmSubmit></form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={`Purchases · ${monthLabel(month)}`} pad={false}>
          {purchases.length === 0 ? <Empty>No purchases this month.</Empty> : (
            <Table>
              <thead><tr><th>Date</th><th>Item</th><th>Vendor</th><th className="text-right">Qty × Rate</th><th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{fmtDate(p.date)}</td><td>{p.name}</td><td className="text-black/60">{p.vendor ?? "—"}</td>
                    <td className="num whitespace-nowrap text-right text-black/60">{Number(p.qty)} × {inr(p.rate)}</td>
                    <td className="num text-right font-medium">{inr(p.amount)}</td>
                    <td><form action={deletePurchase}><input type="hidden" name="id" value={p.id} /><ConfirmSubmit message="Delete this purchase?">✕</ConfirmSubmit></form></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card title={`Usage · ${monthLabel(month)}`} pad={false}>
          {usage.length === 0 ? <Empty>No usage recorded.</Empty> : (
            <Table>
              <thead><tr><th>Date</th><th>Item</th><th className="text-right">Qty</th><th>Note</th><th></th></tr></thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.id}>
                    <td className="whitespace-nowrap">{fmtDate(u.date)}</td><td>{u.name}</td><td className="num text-right">{Number(u.qty)} {u.unit}</td><td className="text-black/60">{u.note ?? ""}</td>
                    <td><form action={deleteUsage}><input type="hidden" name="id" value={u.id} /><ConfirmSubmit message="Delete?">✕</ConfirmSubmit></form></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
