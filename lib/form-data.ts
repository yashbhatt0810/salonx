import { db } from "./db";

/** Lists the booking form needs, as plain JSON-safe objects. */
export async function bookingLists() {
  const sql = db();
  const [services, stylists, seats, customers] = await Promise.all([
    sql`SELECT s.id, s.name, s.price, s.duration_min, coalesce(c.name,'Other') AS category FROM services s
        LEFT JOIN service_categories c ON c.id = s.category_id WHERE s.active ORDER BY c.sort NULLS LAST, c.name, s.name`,
    sql`SELECT id, name FROM employees WHERE active AND is_stylist ORDER BY id`,
    sql`SELECT id, name FROM seats WHERE active ORDER BY id`,
    sql`SELECT id, name, phone FROM customers ORDER BY name`,
  ]);
  return JSON.parse(JSON.stringify({ services, stylists, seats, customers }));
}
