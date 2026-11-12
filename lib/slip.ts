import { db } from "./db";
import { salarySheet } from "./salary";
import { getSettings } from "./settings";
import { monthRange } from "./utils";

export async function loadSlip(employeeId: number, month: string) {
  const sql = db();
  const [[e], [r], txns, st] = await Promise.all([
    sql`SELECT id, name, designation, phone, joining_date FROM employees WHERE id = ${employeeId}`,
    salarySheet(month, employeeId),
    sql`SELECT type, amount, date, note FROM employee_txns WHERE employee_id = ${employeeId} AND salary_month = ${month} ORDER BY date`,
    getSettings(),
  ]);
  if (!e || !r) return null;
  return { e: e as never, r, txns: txns as never, st, days: monthRange(month).days };
}

export const validMonth = (m: string | undefined, fallback: string) => (m && /^\d{4}-\d{2}$/.test(m) ? m : fallback);
