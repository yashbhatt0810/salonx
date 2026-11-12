"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireAdmin, requireOwner } from "./auth";
import { today } from "./utils";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  const t = typeof v === "string" ? v.trim() : "";
  return t === "" ? null : t;
};
const n = (f: FormData, k: string, d = 0) => {
  const v = s(f, k);
  const x = v === null ? d : Number(v);
  return Number.isFinite(x) ? x : d;
};
const id = (f: FormData, k = "id") => {
  const x = Number(f.get(k));
  if (!Number.isInteger(x) || x <= 0) throw new Error("Invalid id");
  return x;
};
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";

function done(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

/* ───────────── Seats ───────────── */
export async function addSeat(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) return;
  await db()`INSERT INTO seats (name) VALUES (${name})`;
  done("/seats");
}
export async function toggleSeat(f: FormData) {
  await requireAdmin();
  await db()`UPDATE seats SET active = NOT active WHERE id = ${id(f)}`;
  done("/seats");
}
export async function deleteSeat(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM seats WHERE id = ${id(f)}`;
  done("/seats");
}

/* ───────────── Customers ───────────── */
export async function saveCustomer(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) throw new Error("Name is required");
  const data = {
    name,
    phone: s(f, "phone")?.replace(/\s/g, "") ?? null,
    gender: s(f, "gender"),
    dob: s(f, "dob"),
    anniversary: s(f, "anniversary"),
    address: s(f, "address"),
    notes: s(f, "notes"),
    whatsapp_consent: bool(f, "whatsapp_consent"),
  };
  const existing = s(f, "id");
  let cid: number;
  if (existing) {
    cid = Number(existing);
    await db()`UPDATE customers SET ${db()(data)},
      consent_at = CASE WHEN ${data.whatsapp_consent} THEN coalesce(consent_at, now()) ELSE NULL END
      WHERE id = ${cid}`;
  } else {
    const dup = data.phone ? await db()`SELECT id FROM customers WHERE phone = ${data.phone}` : [];
    if (dup.length) redirect(`/customers/${dup[0].id}?dup=1`);
    const [r] = await db()`INSERT INTO customers ${db()({ ...data, consent_at: data.whatsapp_consent ? new Date() : null })} RETURNING id`;
    cid = r.id;
  }
  done("/customers", `/customers/${cid}`);
  redirect(`/customers/${cid}`);
}
export async function deleteCustomer(f: FormData) {
  await requireOwner();
  await db()`DELETE FROM customers WHERE id = ${id(f)}`;
  done("/customers");
  redirect("/customers");
}

/* ───────────── Service categories & services ───────────── */
export async function addCategory(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) return;
  await db()`INSERT INTO service_categories (name, sort) VALUES (${name}, (SELECT coalesce(max(sort),0)+1 FROM service_categories)) ON CONFLICT (name) DO NOTHING`;
  done("/services");
}
export async function renameCategory(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) return;
  await db()`UPDATE service_categories SET name = ${name} WHERE id = ${id(f)}`;
  done("/services");
}
export async function deleteCategory(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM service_categories WHERE id = ${id(f)}`;
  done("/services");
}
export async function saveService(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) return;
  const data = {
    name,
    category_id: s(f, "category_id") ? Number(s(f, "category_id")) : null,
    price: n(f, "price"),
    duration_min: s(f, "duration_min") ? n(f, "duration_min") : null,
  };
  const existing = s(f, "id");
  if (existing) await db()`UPDATE services SET ${db()(data)} WHERE id = ${Number(existing)}`;
  else await db()`INSERT INTO services ${db()(data)}`;
  done("/services", "/billing");
}
export async function toggleService(f: FormData) {
  await requireAdmin();
  await db()`UPDATE services SET active = NOT active WHERE id = ${id(f)}`;
  done("/services", "/billing");
}
export async function deleteService(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM services WHERE id = ${id(f)}`;
  done("/services", "/billing");
}

/* ───────────── Employees ───────────── */
export async function saveEmployee(f: FormData) {
  const me = await requireAdmin();
  const name = s(f, "name");
  if (!name) throw new Error("Name is required");
  const base = {
    name,
    phone: s(f, "phone"),
    email: s(f, "email")?.toLowerCase() ?? null,
    designation: s(f, "designation"),
    joining_date: s(f, "joining_date"),
    can_login: bool(f, "can_login"),
    is_stylist: bool(f, "is_stylist"),
    can_book: bool(f, "can_book"),
    active: s(f, "id") ? bool(f, "active") : true,
  };
  // Money and role fields are owner-only.
  const money =
    me.role === "owner"
      ? { role: s(f, "role") === "manager" ? "manager" : "barber", monthly_salary: n(f, "monthly_salary"), commission_pct: n(f, "commission_pct") }
      : {};
  const data = { ...base, ...money };
  const existing = s(f, "id");
  let eid: number;
  if (existing) {
    eid = Number(existing);
    await db()`UPDATE employees SET ${db()(data)} WHERE id = ${eid}`;
  } else {
    const [r] = await db()`INSERT INTO employees ${db()(data)} RETURNING id`;
    eid = r.id;
  }
  done("/staff", `/staff/${eid}`);
  redirect(`/staff/${eid}`);
}
export async function deleteEmployee(f: FormData) {
  await requireOwner();
  await db()`DELETE FROM employees WHERE id = ${id(f)}`;
  done("/staff");
  redirect("/staff");
}

/* ───────────── Attendance ───────────── */
export async function saveAttendanceDay(f: FormData) {
  await requireAdmin();
  const date = s(f, "date") ?? today();
  const sql = db();
  for (const [k, v] of f.entries()) {
    if (!k.startsWith("att_")) continue;
    const eid = Number(k.slice(4));
    const status = String(v);
    if (!eid) continue;
    if (status === "") await sql`DELETE FROM attendance WHERE employee_id = ${eid} AND date = ${date}`;
    else if (["P", "H", "A", "W"].includes(status))
      await sql`INSERT INTO attendance (employee_id, date, status) VALUES (${eid}, ${date}, ${status})
                ON CONFLICT (employee_id, date) DO UPDATE SET status = EXCLUDED.status`;
  }
  done("/attendance", "/salary", "/");
  redirect(`/attendance?date=${date}&saved=1`);
}
export async function setAttendance(f: FormData) {
  await requireAdmin();
  const eid = id(f, "employee_id");
  const date = s(f, "date");
  const status = s(f, "status");
  if (!date) return;
  if (!status) await db()`DELETE FROM attendance WHERE employee_id = ${eid} AND date = ${date}`;
  else
    await db()`INSERT INTO attendance (employee_id, date, status) VALUES (${eid}, ${date}, ${status})
               ON CONFLICT (employee_id, date) DO UPDATE SET status = EXCLUDED.status`;
  done(`/staff/${eid}`, "/salary", "/attendance");
}

/* ───────────── Staff money: upad / bonus / salary paid ───────────── */
export async function addEmployeeTxn(f: FormData) {
  await requireOwner();
  const eid = id(f, "employee_id");
  const type = s(f, "type");
  if (!type || !["upad", "bonus", "salary_paid"].includes(type)) throw new Error("Invalid type");
  const amount = n(f, "amount");
  if (amount <= 0) return;
  const date = s(f, "date") ?? today();
  const salary_month = s(f, "salary_month") ?? date.slice(0, 7);
  const note = s(f, "note");
  const mode = s(f, "payment_mode") ?? "Cash";
  const sql = db();
  const [emp] = await sql`SELECT name FROM employees WHERE id = ${eid}`;

  await sql.begin(async (tx) => {
    let expense_id: number | null = null;
    // Upad and salary are real cash going out — mirror them into expenses so P&L is right.
    // Bonus is only added to the salary sheet; it leaves the drawer when salary is paid.
    if (type !== "bonus") {
      const category = type === "upad" ? "Staff Advance (Upad)" : "Salary";
      const [e] = await tx`INSERT INTO expenses (category, amount, date, payment_mode, note, employee_id)
        VALUES (${category}, ${amount}, ${date}, ${mode}, ${`${emp?.name ?? "Staff"} — ${salary_month}${note ? " · " + note : ""}`}, ${eid}) RETURNING id`;
      expense_id = e.id;
    }
    await tx`INSERT INTO employee_txns (employee_id, type, amount, date, salary_month, note, expense_id)
      VALUES (${eid}, ${type}, ${amount}, ${date}, ${salary_month}, ${note}, ${expense_id})`;
  });
  done(`/staff/${eid}`, "/salary", "/expenses", "/");
}
export async function deleteEmployeeTxn(f: FormData) {
  await requireOwner();
  const tid = id(f);
  const sql = db();
  const [t] = await sql`SELECT employee_id, expense_id FROM employee_txns WHERE id = ${tid}`;
  if (!t) return;
  await sql.begin(async (tx) => {
    await tx`DELETE FROM employee_txns WHERE id = ${tid}`;
    if (t.expense_id) await tx`DELETE FROM expenses WHERE id = ${t.expense_id}`;
  });
  done(`/staff/${t.employee_id}`, "/salary", "/expenses", "/");
}

/* ───────────── Billing / visits ───────────── */
export type BillInput = {
  customerId: number | null;
  newCustomer?: { name: string; phone: string | null; consent?: boolean } | null;
  seatId: number | null;
  date: string;
  appointmentId?: number | null;
  discount: number;
  paymentMode: string;
  notes: string | null;
  items: { serviceId: number | null; name: string; employeeId: number | null; price: number; qty: number }[];
};

export async function createBill(input: BillInput): Promise<{ ok: true; visitId: number } | { ok: false; error: string }> {
  const me = await requireAdmin();
  const items = input.items.filter((i) => i.name && i.price >= 0 && i.qty > 0);
  if (items.length === 0) return { ok: false, error: "Add at least one service" };
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = Math.min(Math.max(0, Number(input.discount) || 0), subtotal);
  const total = subtotal - discount;
  const sql = db();
  try {
    const visitId = await sql.begin(async (tx) => {
      let customerId = input.customerId;
      if (!customerId && input.newCustomer?.name) {
        const phone = input.newCustomer.phone?.replace(/\s/g, "") || null;
        const found = phone ? await tx`SELECT id FROM customers WHERE phone = ${phone}` : [];
        if (found.length) customerId = found[0].id;
        else {
          const consent = Boolean(input.newCustomer.consent);
          const [c] = await tx`INSERT INTO customers (name, phone, whatsapp_consent, consent_at)
            VALUES (${input.newCustomer.name.trim()}, ${phone}, ${consent}, ${consent ? new Date() : null}) RETURNING id`;
          customerId = c.id;
        }
      }
      const [v] = await tx`INSERT INTO visits (customer_id, seat_id, visit_date, subtotal, discount, total, payment_mode, notes, created_by)
        VALUES (${customerId}, ${input.seatId}, ${input.date || today()}, ${subtotal}, ${discount}, ${total}, ${input.paymentMode || "Cash"}, ${input.notes}, ${me.name})
        RETURNING id`;
      for (const i of items) {
        await tx`INSERT INTO visit_items (visit_id, service_id, service_name, employee_id, price, qty)
          VALUES (${v.id}, ${i.serviceId}, ${i.name}, ${i.employeeId}, ${i.price}, ${i.qty})`;
      }
      if (input.appointmentId) {
        await tx`UPDATE appointments SET status = 'completed', visit_id = ${v.id},
          customer_id = coalesce(customer_id, ${customerId}) WHERE id = ${input.appointmentId} AND visit_id IS NULL`;
      }
      return v.id as number;
    });
    done("/", "/visits", "/customers", "/reports", "/salary", "/appointments", "/me");
    return { ok: true, visitId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save bill" };
  }
}
export async function deleteVisit(f: FormData) {
  await requireOwner();
  await db()`DELETE FROM visits WHERE id = ${id(f)}`;
  done("/", "/visits", "/customers", "/reports", "/salary");
  redirect("/visits");
}

/* ───────────── Expenses ───────────── */
export async function addExpense(f: FormData) {
  await requireAdmin();
  const category = s(f, "category");
  const amount = n(f, "amount");
  if (!category || amount <= 0) return;
  await db()`INSERT INTO expenses (category, amount, date, payment_mode, note)
    VALUES (${category}, ${amount}, ${s(f, "date") ?? today()}, ${s(f, "payment_mode") ?? "Cash"}, ${s(f, "note")})`;
  done("/expenses", "/", "/reports");
}
export async function deleteExpense(f: FormData) {
  await requireAdmin();
  const eid = id(f);
  // Keep staff ledger in sync if this expense came from upad/salary.
  await db().begin(async (tx) => {
    await tx`DELETE FROM employee_txns WHERE expense_id = ${eid}`;
    await tx`DELETE FROM expenses WHERE id = ${eid}`;
  });
  done("/expenses", "/", "/reports", "/salary");
}
export async function addExpenseCategory(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) return;
  await db()`INSERT INTO expense_categories (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
  done("/expenses");
}
export async function deleteExpenseCategory(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM expense_categories WHERE id = ${id(f)}`;
  done("/expenses");
}

/* ───────────── Purchases & stock ───────────── */
export async function saveItem(f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  if (!name) return;
  const data = { name, unit: s(f, "unit") ?? "pcs", category: s(f, "category"), min_stock: n(f, "min_stock") };
  const existing = s(f, "id");
  if (existing) await db()`UPDATE purchase_items SET ${db()(data)} WHERE id = ${Number(existing)}`;
  else await db()`INSERT INTO purchase_items ${db()(data)}`;
  done("/purchases");
}
export async function deleteItem(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM purchase_items WHERE id = ${id(f)}`;
  done("/purchases", "/");
}
export async function addPurchase(f: FormData) {
  await requireAdmin();
  const item_id = id(f, "item_id");
  const qty = n(f, "qty");
  const rate = n(f, "rate");
  if (qty <= 0) return;
  const amount = s(f, "amount") ? n(f, "amount") : qty * rate;
  await db()`INSERT INTO purchases (item_id, vendor, qty, rate, amount, date, payment_mode, note)
    VALUES (${item_id}, ${s(f, "vendor")}, ${qty}, ${rate}, ${amount}, ${s(f, "date") ?? today()}, ${s(f, "payment_mode") ?? "Cash"}, ${s(f, "note")})`;
  done("/purchases", "/", "/reports");
}
export async function deletePurchase(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM purchases WHERE id = ${id(f)}`;
  done("/purchases", "/", "/reports");
}
export async function addUsage(f: FormData) {
  await requireAdmin();
  const qty = n(f, "qty");
  if (qty <= 0) return;
  await db()`INSERT INTO stock_usage (item_id, qty, date, note) VALUES (${id(f, "item_id")}, ${qty}, ${s(f, "date") ?? today()}, ${s(f, "note")})`;
  done("/purchases", "/");
}
export async function deleteUsage(f: FormData) {
  await requireAdmin();
  await db()`DELETE FROM stock_usage WHERE id = ${id(f)}`;
  done("/purchases", "/");
}

/* ───────────── Settings ───────────── */
export async function saveSettings(f: FormData) {
  await requireOwner();
  const sql = db();
  for (const key of ["salon_name", "salon_address", "salon_phone", "bill_footer", "reminder_days", "contact_email", "owner_name", "city", "open_time", "close_time", "slot_minutes", "booking_days"]) {
    const v = s(f, key);
    if (v === null) await sql`DELETE FROM settings WHERE key = ${key}`;
    else await sql`INSERT INTO settings (key, value) VALUES (${key}, ${v}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
  const be = bool(f, "booking_enabled") ? "1" : "0";
  await sql`INSERT INTO settings (key, value) VALUES ('booking_enabled', ${be}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  done("/", "/settings");
  redirect("/settings?saved=1");
}

/* ───────────── Employee login ID & password (Clerk) ───────────── */
function clerkError(e: unknown): string {
  const errs = (e as { errors?: { longMessage?: string; message?: string; code?: string }[] })?.errors;
  const first = errs?.[0];
  if (/email_address/i.test(`${first?.message} ${first?.longMessage} ${first?.code}`))
    return "Clerk is asking for an email for every account. Either add this staff member's email in Profile below and try again, or in Clerk turn Email address to optional (Configure → User & authentication → Email → Required: off).";
  if (/password/i.test(`${first?.code}`) || /password/i.test(first?.message ?? ""))
    return first?.longMessage || "Password does not meet the Clerk password rules.";
  if (first?.code === "form_param_unknown" || /username/i.test(first?.message ?? "") && /not.*(enabled|allowed|valid)/i.test(first?.longMessage ?? ""))
    return "Turn on Username + Password sign-in in Clerk (Configure → User & authentication) and try again.";
  return first?.longMessage || first?.message || (e instanceof Error ? e.message : "Could not save login");
}

export async function setEmployeeLogin(f: FormData) {
  await requireOwner();
  const eid = id(f, "employee_id");
  const username = (s(f, "username") ?? "").toLowerCase();
  const password = String(f.get("password") ?? "");
  const back = (msg: string, ok = false) => redirect(`/staff/${eid}?${ok ? "loginOk" : "loginErr"}=${encodeURIComponent(msg)}#login`);
  if (!/^[a-z0-9_.-]{4,30}$/.test(username)) back("Login ID: 4–30 letters/numbers (a-z, 0-9, _ . -), no spaces.");
  const sql = db();
  const [emp] = await sql`SELECT id, name, email, clerk_user_id FROM employees WHERE id = ${eid}`;
  if (!emp) back("Staff not found");
  if (!emp.clerk_user_id && password.length < 8) back("Password must be at least 8 characters.");
  if (emp.clerk_user_id && password && password.length < 8) back("Password must be at least 8 characters.");

  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const [first, ...rest] = String(emp.name).trim().split(/\s+/);
  let clerkId: string = emp.clerk_user_id;
  try {
    if (clerkId) {
      await client.users.updateUser(clerkId, { username, ...(password ? { password, skipPasswordChecks: false, signOutOfOtherSessions: true } : {}) });
    } else {
      const u = await client.users.createUser({
        username, password, firstName: first, lastName: rest.join(" ") || undefined,
        ...(emp.email ? { emailAddress: [String(emp.email)] } : {}),
        publicMetadata: { salonxEmployeeId: eid },
      });
      clerkId = u.id;
    }
  } catch (e) {
    back(clerkError(e));
  }
  await sql`UPDATE employees SET username = ${username}, clerk_user_id = ${clerkId}, can_login = TRUE WHERE id = ${eid}`;
  revalidatePath(`/staff/${eid}`);
  back(password ? "Login saved. Share the Login ID and password with the staff member." : "Login ID updated.", true);
}

export async function disableEmployeeLogin(f: FormData) {
  await requireOwner();
  const eid = id(f, "employee_id");
  const [emp] = await db()`SELECT clerk_user_id FROM employees WHERE id = ${eid}`;
  if (emp?.clerk_user_id) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      await (await clerkClient()).users.lockUser(emp.clerk_user_id);
    } catch { /* access is still blocked by can_login below */ }
  }
  await db()`UPDATE employees SET can_login = FALSE WHERE id = ${eid}`;
  revalidatePath(`/staff/${eid}`);
  redirect(`/staff/${eid}?loginOk=${encodeURIComponent("Login disabled.")}#login`);
}

export async function enableEmployeeLogin(f: FormData) {
  await requireOwner();
  const eid = id(f, "employee_id");
  const [emp] = await db()`SELECT clerk_user_id FROM employees WHERE id = ${eid}`;
  if (emp?.clerk_user_id) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      await (await clerkClient()).users.unlockUser(emp.clerk_user_id);
    } catch { /* ignore */ }
  }
  await db()`UPDATE employees SET can_login = TRUE WHERE id = ${eid}`;
  revalidatePath(`/staff/${eid}`);
  redirect(`/staff/${eid}?loginOk=${encodeURIComponent("Login enabled.")}#login`);
}
