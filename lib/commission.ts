import { db } from "./db";
import { monthRange } from "./utils";

export type CommissionDetail = {
  pct: number;
  sale: number;
  commission: number;
  services: number;
  days: { date: string; services: number; sale: number; commission: number }[];
  byService: { name: string; n: number; sale: number; commission: number }[];
};

const r2 = (x: number) => Math.round(x * 100) / 100;

export async function commissionDetail(employeeId: number, month: string): Promise<CommissionDetail> {
  const sql = db();
  const { start, end } = monthRange(month);
  const [[emp], days, byService] = await Promise.all([
    sql`SELECT commission_pct FROM employees WHERE id = ${employeeId}`,
    sql`SELECT v.visit_date AS date, count(*)::int AS n, sum(vi.price*vi.qty) AS sale FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        WHERE vi.employee_id = ${employeeId} AND v.visit_date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 1`,
    sql`SELECT vi.service_name AS name, count(*)::int AS n, sum(vi.price*vi.qty) AS sale FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
        WHERE vi.employee_id = ${employeeId} AND v.visit_date BETWEEN ${start} AND ${end} GROUP BY 1 ORDER BY 3 DESC`,
  ]);
  const pct = Number(emp?.commission_pct ?? 0);
  const d = days.map((r) => ({ date: r.date, services: r.n, sale: Number(r.sale), commission: r2((Number(r.sale) * pct) / 100) }));
  const sale = d.reduce((a, x) => a + x.sale, 0);
  return {
    pct, sale, commission: r2((sale * pct) / 100), services: d.reduce((a, x) => a + x.services, 0), days: d,
    byService: byService.map((r) => ({ name: r.name, n: r.n, sale: Number(r.sale), commission: r2((Number(r.sale) * pct) / 100) })),
  };
}

/** All staff summary for a month. */
export async function commissionSummary(month: string) {
  const { start, end } = monthRange(month);
  const rows = await db()`
    SELECT e.id, e.name, e.commission_pct, e.active,
      coalesce(sum(vi.price*vi.qty),0) AS sale, count(vi.id)::int AS services
    FROM employees e
    LEFT JOIN visit_items vi ON vi.employee_id = e.id
      AND vi.visit_id IN (SELECT id FROM visits WHERE visit_date BETWEEN ${start} AND ${end})
    GROUP BY e.id HAVING e.active OR count(vi.id) > 0 ORDER BY sale DESC`;
  return rows.map((r) => ({
    id: r.id as number, name: r.name as string, pct: Number(r.commission_pct), sale: Number(r.sale), services: r.services as number,
    commission: r2((Number(r.sale) * Number(r.commission_pct)) / 100),
  }));
}
