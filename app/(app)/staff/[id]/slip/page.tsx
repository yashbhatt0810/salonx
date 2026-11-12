import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { loadSlip, validMonth } from "@/lib/slip";
import { MonthNav } from "@/components/ui";
import { SalarySlip } from "@/components/SalarySlip";
import { PrintButton } from "@/components/PrintButton";
import { monthLabel, shiftMonth, thisMonth } from "@/lib/utils";

export default async function StaffSlip({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  await requireOwner();
  const id = Number((await params).id);
  const month = validMonth((await searchParams).month, thisMonth());
  const data = await loadSlip(id, month);
  if (!data) notFound();
  return (
    <>
      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/staff/${id}?month=${month}`} className="btn-ghost"><ArrowLeft size={15} /> Back</Link>
        <div className="flex items-center gap-2">
          <MonthNav base={`/staff/${id}/slip`} month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />
          <PrintButton />
        </div>
      </div>
      <SalarySlip {...data} month={month} />
    </>
  );
}
