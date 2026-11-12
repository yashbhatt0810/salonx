import { requireAny } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAny();
  const settings = await getSettings();
  return <Shell me={me} salonName={settings.salon_name}>{children}</Shell>;
}
