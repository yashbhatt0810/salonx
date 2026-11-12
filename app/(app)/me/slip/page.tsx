import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAny } from "@/lib/auth";
import { loadSlip, validMonth } from "@/lib/slip";
import { MonthNav } from "@/components/ui";
import { SalarySlip } from "@/components/SalarySlip";
import { PrintButton } from "@/components/PrintButton";
import { monthLabel, shiftMonth, thisMonth } from "@/lib/utils";

export default async function MySlip({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const me = await requireAny();
  if (!me.employeeId) redirect("/salary");
  const month = validMonth((await searchParams).month, thisMonth());
  const data = await loadSlip(me.employeeId, month);
  if (!data) notFound();
  return (
    <>
      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/me" className="btn-ghost"><ArrowLeft size={15} /> My panel</Link>
        <div className="flex items-center gap-2">
          <MonthNav base="/me/slip" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />
          <PrintButton />
        </div>
      </div>
      <SalarySlip {...data} month={month} />
    </>
  );
}
