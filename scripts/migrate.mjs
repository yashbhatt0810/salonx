// Runs db/schema.sql and seeds defaults on first run. Called before `next start`.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL not set — skipping migration.");
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql.unsafe(readFileSync(join(here, "..", "db", "schema.sql"), "utf8"));

  const [{ n: cats }] = await sql`SELECT count(*)::int AS n FROM service_categories`;
  if (cats === 0) {
    const seed = {
      "Hair": [["Haircut", 150, 30], ["Kids Haircut", 100, 20], ["Hair Wash", 80, 15], ["Hair Colour", 600, 60], ["Hair Spa", 700, 45]],
      "Beard": [["Beard Trim", 80, 15], ["Clean Shave", 70, 15], ["Beard Styling", 120, 20]],
      "Face & Skin": [["Face Massage", 200, 20], ["Facial", 800, 45], ["D-Tan", 400, 30]],
      "Combo": [["Haircut + Beard", 200, 40], ["Haircut + Hair Spa", 800, 75]],
    };
    let sort = 0;
    for (const [cat, list] of Object.entries(seed)) {
      const [{ id }] = await sql`INSERT INTO service_categories (name, sort) VALUES (${cat}, ${sort++}) RETURNING id`;
      for (const [name, price, dur] of list) {
        await sql`INSERT INTO services (category_id, name, price, duration_min) VALUES (${id}, ${name}, ${price}, ${dur})`;
      }
    }
    console.log("[migrate] seeded service categories & services");
  }

  const [{ n: exc }] = await sql`SELECT count(*)::int AS n FROM expense_categories`;
  if (exc === 0) {
    for (const name of ["Salary", "Staff Advance (Upad)", "Tea / Snacks", "Fuel", "Rent", "Electricity", "Water", "Maintenance", "Marketing", "Products / Consumables", "Other"]) {
      await sql`INSERT INTO expense_categories (name) VALUES (${name})`;
    }
    console.log("[migrate] seeded expense categories");
  }

  const [{ n: seats }] = await sql`SELECT count(*)::int AS n FROM seats`;
  if (seats === 0) {
    for (const name of ["Seat 1", "Seat 2", "Seat 3"]) await sql`INSERT INTO seats (name) VALUES (${name})`;
    console.log("[migrate] seeded seats");
  }

  console.log("[migrate] done");
} catch (e) {
  console.error("[migrate] failed:", e);
  process.exit(1);
} finally {
  await sql.end();
}
