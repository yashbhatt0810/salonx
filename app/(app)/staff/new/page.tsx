import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { EmployeeForm } from "@/components/EmployeeForm";

export default async function NewStaff() {
  const me = await requireAdmin();
  return (
    <>
      <PageHeader icon="staff" title="Add staff" />
      <Card className="max-w-2xl"><EmployeeForm isOwner={me.role === "owner"} /></Card>
    </>
  );
}
