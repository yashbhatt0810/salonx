import { NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "not configured";
  if (hasDb()) {
    try {
      await db()`SELECT 1`;
      database = "ok";
    } catch {
      database = "error";
    }
  }
  return NextResponse.json({ ok: true, app: "salonx", database, clerk: Boolean(process.env.CLERK_SECRET_KEY) });
}
