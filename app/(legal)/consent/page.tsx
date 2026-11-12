import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { H, LEGAL_UPDATED, LegalDoc, UL } from "@/components/Legal";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = { title: "Consent · SalonX" };

export default async function Consent() {
  const s = await getSettings();
  const biz = s.owner_name || s.salon_name;
  const Box = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 rounded-xl border border-black/10 p-3">
      <span className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-black/40" />
      <span>{children}</span>
    </div>
  );
  return (
    <LegalDoc title="Customer Consent" updated={LEGAL_UPDATED}>
      <p>
        <b>{s.salon_name}</b> uses SalonX to keep your bills and service history. Under the Digital Personal Data Protection Act,
        2023, we ask for your clear consent before using your details. You may say yes to some, all or none of the points below —
        your service will not be affected either way, except point 1 which is needed to make your bill.
      </p>

      <H n={1}>What you agree to</H>
      <div className="space-y-2">
        <Box>
          <b>Service record (required for billing).</b> I agree that my name, mobile number and the services I take, with the barber
          who served me, are saved to create my bill and to remember my preferences for future visits.
        </Box>
        <Box>
          <b>Personal dates (optional).</b> I agree to share my birthday / anniversary so the Salon can wish me.
        </Box>
        <Box>
          <b>WhatsApp / SMS messages (optional).</b> I agree to receive my bills, visit reminders, birthday/anniversary wishes and
          offers from {s.salon_name} on WhatsApp or SMS.
        </Box>
      </div>

      <H n={2}>How you can change your mind</H>
      <UL items={[
        "Reply STOP on WhatsApp/SMS, or tell any staff member at the counter.",
        "We will update your choice in SalonX right away and stop messages.",
        "You can also ask to see, correct or delete your details at any time.",
      ]} />

      <H n={3}>For customers under 18</H>
      <p>A parent or guardian gives consent on behalf of the child. No promotional messages are sent to children.</p>

      <H n={4}>Staff consent</H>
      <p>
        By accepting a SalonX login, staff members agree that their name, contact, attendance, work records and salary details are
        processed by {biz} for running the Salon and paying salary, as described in the{" "}
        <a className="text-brass-dark underline" href="/privacy">Privacy Policy</a>.
      </p>

      <H n={5}>Signature (for printed copy)</H>
      <div className="grid gap-4 pt-2 sm:grid-cols-2">
        {["Customer name", "Mobile", "Signature", "Date"].map((l) => (
          <div key={l}><div className="h-8 border-b border-black/30" /><div className="mt-1 text-xs text-black/50">{l}</div></div>
        ))}
      </div>

      <p className="pt-2 text-sm text-black/60">
        Full details: <a className="text-brass-dark underline" href="/privacy">Privacy Policy</a> ·{" "}
        <a className="text-brass-dark underline" href="/terms">Terms &amp; Conditions</a>
      </p>
      <div className="print:hidden"><PrintButton /></div>
    </LegalDoc>
  );
}
