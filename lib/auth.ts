import { redirect } from "next/navigation";
import { db } from "./db";

export type Role = "owner" | "manager" | "barber";
export type Me = { name: string; email: string; role: Role; employeeId: number | null };

export const clerkEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

function ownerEmails(): string[] {
  return (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Resolves the signed-in Clerk user to a SalonX role. null = signed in but no access. */
export async function getMe(): Promise<Me | null> {
  if (!clerkEnabled()) return null;
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) return null;
  const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || emails[0] || "User";

  const owners = ownerEmails();
  const ownerEmail = emails.find((e) => owners.includes(e));
  if (ownerEmail) return { name, email: ownerEmail, role: "owner", employeeId: null };

  const sql = db();
  const rows = await sql`
    SELECT id, name, email, role FROM employees
    WHERE active AND can_login AND (clerk_user_id = ${user.id}
      ${emails.length ? sql`OR lower(email) IN ${sql(emails)}` : sql``})
    ORDER BY (clerk_user_id = ${user.id}) DESC NULLS LAST
    LIMIT 1`;
  if (rows.length === 0) return null;
  const r = rows[0];
  return { name: r.name, email: r.email ?? user.username ?? "", role: r.role === "manager" ? "manager" : "barber", employeeId: r.id };
}

/** For admin pages: owner + manager. Barbers are sent to their own panel. */
export async function requireAdmin(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/no-access");
  if (me.role === "barber") redirect("/me");
  return me;
}

/** Owner-only (salary, staff money, deletes of money records). */
export async function requireOwner(): Promise<Me> {
  const me = await requireAdmin();
  if (me.role !== "owner") redirect("/?denied=1");
  return me;
}

export async function requireAny(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/no-access");
  return me;
}
