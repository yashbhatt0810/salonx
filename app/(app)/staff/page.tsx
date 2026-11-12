import Link from "next/link";
import { UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Card, Empty, PageHeader, Table } from "@/components/ui";
import { inr, monthRange, thisMonth } from "@/lib/utils";

export default async function Staff() {
  const me = await requireAdmin();
  const { start, end } = monthRange(thisMonth());
  const rows = await db()`
    SELECT e.*, coalesce((SELECT sum(vi.price*vi.qty) FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
      WHERE vi.employee_id = e.id AND v.visit_date BETWEEN ${start} AND ${end}),0) AS month_sale,
      (SELECT count(*)::int FROM visit_items vi JOIN visits v ON v.id = vi.visit_id WHERE vi.employee_id = e.id AND v.visit_date BETWEEN ${start} AND ${end}) AS month_services
    FROM employees e ORDER BY e.active DESC, e.name`;
  return (
    <>
      <PageHeader icon="staff" title="Staff" sub={`${rows.filter((r) => r.active).length} active`} action={<Link href="/staff/new" className="btn-brass"><UserPlus size={15} /> Add staff</Link>} />
      <Card pad={false}>
        {rows.length === 0 ? <Empty>No staff yet. Add your barbers to start billing.</Empty> : (
          <Table>
            <thead><tr><th>Name</th><th>Role</th><th>Mobile</th>{me.role === "owner" && <th className="text-right">Salary</th>}<th className="text-right">This month</th><th>Login</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.active ? "" : "opacity-50"}>
                  <td><Link className="font-medium hover:text-brass-dark" href={`/staff/${r.id}`}>{r.name}</Link><div className="text-xs text-black/45">{r.designation ?? ""}</div></td>
                  <td className="capitalize">{r.role}{!r.active && " · left"}</td>
                  <td className="text-black/60">{r.phone ?? "—"}</td>
                  {me.role === "owner" && <td className="num text-right">{inr(r.monthly_salary)}{Number(r.commission_pct) > 0 && <div className="text-xs text-black/45">+{Number(r.commission_pct)}%</div>}</td>}
                  <td className="num text-right">{inr(r.month_sale)}<div className="text-xs text-black/45">{r.month_services} services</div></td>
                  <td>{r.can_login ? <span className="pill bg-emerald-50 text-emerald-700">Yes</span> : <span className="pill bg-black/5 text-black/45">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
