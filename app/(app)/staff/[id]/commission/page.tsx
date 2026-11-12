import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { commissionDetail } from "@/lib/commission";
import { validMonth } from "@/lib/slip";
import { MonthNav, PageHeader } from "@/components/ui";
import { CommissionView } from "@/components/CommissionView";
import { monthLabel, shiftMonth, thisMonth } from "@/lib/utils";

export default async function StaffCommission({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  await requireOwner();
  const id = Number((await params).id);
  const month = validMonth((await searchParams).month, thisMonth());
  const [e] = await db()`SELECT id, name FROM employees WHERE id = ${id}`;
  if (!e) notFound();
  const d = await commissionDetail(id, month);
  return (
    <>
      <PageHeader icon="commission" title={`${e.name} · Commission`}
        action={<>
          <Link href={`/staff/${id}?month=${month}`} className="btn-ghost"><ArrowLeft size={15} /> Profile</Link>
          <MonthNav base={`/staff/${id}/commission`} month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />
        </>} />
      <CommissionView d={d} month={month} />
    </>
  );
}
