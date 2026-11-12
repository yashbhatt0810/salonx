import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/CustomerForm";

export default async function NewCustomer() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add customer" />
      <Card className="max-w-2xl"><CustomerForm /></Card>
    </>
  );
}
