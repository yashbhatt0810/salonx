import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Card, Empty, PageHeader, Table } from "@/components/ui";
import { daysSince, fmtDate, inr } from "@/lib/utils";

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sort = sp.sort ?? "recent";
  const sql = db();
  const like = `%${q}%`;
  const order =
    sort === "spend" ? sql`spent DESC NULLS LAST` :
    sort === "visits" ? sql`visits DESC` :
    sort === "name" ? sql`c.name` : sql`last_visit DESC NULLS LAST, c.id DESC`;
  const rows = await sql`
    SELECT c.id, c.name, c.phone, c.gender, count(v.id)::int AS visits, sum(v.total) AS spent, max(v.visit_date) AS last_visit
    FROM customers c LEFT JOIN visits v ON v.customer_id = c.id
    ${q ? sql`WHERE c.name ILIKE ${like} OR c.phone ILIKE ${like}` : sql``}
    GROUP BY c.id ORDER BY ${order} LIMIT 300`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM customers`;
  return (
    <>
      <PageHeader icon="customers" title="Customers" sub={`${n} customers`} action={<Link href="/customers/new" className="btn-brass"><UserPlus size={15} /> Add customer</Link>} />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-[14rem] flex-1"><span className="label">Search</span><input className="input" name="q" defaultValue={q} placeholder="Name or mobile" /></label>
        <label><span className="label">Sort</span>
          <select className="input" name="sort" defaultValue={sort}>
            <option value="recent">Last visit</option><option value="spend">Top spenders</option><option value="visits">Most visits</option><option value="name">Name</option>
          </select>
        </label>
        <button className="btn-primary"><Search size={14} /> Go</button>
      </form>
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No customers found.</Empty> : (
          <Table>
            <thead><tr><th>Name</th><th>Mobile</th><th className="text-right">Visits</th><th className="text-right">Total spent</th><th>Last visit</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const d = daysSince(r.last_visit);
                return (
                  <tr key={r.id}>
                    <td><Link className="font-medium hover:text-brass-dark" href={`/customers/${r.id}`}>{r.name}</Link></td>
                    <td className="text-black/60">{r.phone ?? "—"}</td>
                    <td className="num text-right">{r.visits}</td>
                    <td className="num text-right">{inr(r.spent)}</td>
                    <td className="whitespace-nowrap">{fmtDate(r.last_visit)}{d !== null && <span className="ml-1 text-xs text-black/45">({d}d)</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
