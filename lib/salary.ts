import { db } from "./db";
import { monthRange, paidDays } from "./utils";

export type SalaryRow = {
  id: number;
  name: string;
  designation: string | null;
  monthly_salary: number;
  commission_pct: number;
  P: number; H: number; A: number; W: number; unmarked: number;
  paid_days: number;
  base: number;
  service_sale: number;
  commission: number;
  bonus: number;
  gross: number;
  upad: number;
  paid: number;
  balance: number;
};

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Salary sheet for a YYYY-MM month. employeeId limits to one person. */
export async function salarySheet(month: string, employeeId?: number): Promise<SalaryRow[]> {
  const sql = db();
  const { start, end, days } = monthRange(month);
  const rows = await sql`
    SELECT e.id, e.name, e.designation, e.monthly_salary, e.commission_pct,
      (SELECT count(*)::int FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN ${start} AND ${end} AND a.status = 'P') AS p,
      (SELECT count(*)::int FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN ${start} AND ${end} AND a.status = 'H') AS h,
      (SELECT count(*)::int FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN ${start} AND ${end} AND a.status = 'A') AS a,
      (SELECT count(*)::int FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN ${start} AND ${end} AND a.status = 'W') AS w,
      coalesce((SELECT sum(vi.price*vi.qty) FROM visit_items vi JOIN visits v ON v.id = vi.visit_id
                WHERE vi.employee_id = e.id AND v.visit_date BETWEEN ${start} AND ${end}),0) AS sale,
      coalesce((SELECT sum(amount) FROM employee_txns t WHERE t.employee_id = e.id AND t.salary_month = ${month} AND t.type = 'bonus'),0) AS bonus,
      coalesce((SELECT sum(amount) FROM employee_txns t WHERE t.employee_id = e.id AND t.salary_month = ${month} AND t.type = 'upad'),0) AS upad,
      coalesce((SELECT sum(amount) FROM employee_txns t WHERE t.employee_id = e.id AND t.salary_month = ${month} AND t.type = 'salary_paid'),0) AS paid
    FROM employees e
    WHERE ${employeeId ? sql`e.id = ${employeeId}` : sql`(e.active OR EXISTS (SELECT 1 FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN ${start} AND ${end}))`}
    ORDER BY e.name`;

  return rows.map((r) => {
    const counts = { P: r.p, H: r.h, A: r.a, W: r.w };
    const pd = paidDays(counts);
    const base = r2((Number(r.monthly_salary) / days) * pd);
    const commission = r2((Number(r.sale) * Number(r.commission_pct)) / 100);
    const gross = r2(base + commission + Number(r.bonus));
    const balance = r2(gross - Number(r.upad) - Number(r.paid));
    return {
      id: r.id, name: r.name, designation: r.designation,
      monthly_salary: Number(r.monthly_salary), commission_pct: Number(r.commission_pct),
      ...counts, unmarked: days - (r.p + r.h + r.a + r.w), paid_days: pd,
      base, service_sale: Number(r.sale), commission, bonus: Number(r.bonus), gross,
      upad: Number(r.upad), paid: Number(r.paid), balance,
    };
  });
}
