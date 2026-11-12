import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAny } from "@/lib/auth";
import { commissionDetail } from "@/lib/commission";
import { validMonth } from "@/lib/slip";
import { MonthNav, PageHeader } from "@/components/ui";
import { CommissionView } from "@/components/CommissionView";
import { monthLabel, shiftMonth, thisMonth } from "@/lib/utils";

export default async function MyCommission({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const me = await requireAny();
  if (!me.employeeId) redirect("/commission");
  const month = validMonth((await searchParams).month, thisMonth());
  const d = await commissionDetail(me.employeeId, month);
  return (
    <>
      <PageHeader icon="commission" title="My commission"
        action={<>
          <Link href="/me" className="btn-ghost"><ArrowLeft size={15} /> My panel</Link>
          <MonthNav base="/me/commission" month={month} label={monthLabel(month)} prev={shiftMonth(month, -1)} next={shiftMonth(month, 1)} />
        </>} />
      <CommissionView d={d} month={month} />
    </>
  );
}
