import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { H, LEGAL_UPDATED, LegalDoc, UL } from "@/components/Legal";

export const metadata: Metadata = { title: "Terms & Conditions · SalonX" };

export default async function Terms() {
  const s = await getSettings();
  const biz = s.owner_name || s.salon_name;
  return (
    <LegalDoc title="Terms & Conditions" updated={LEGAL_UPDATED}>
      <p>
        These Terms apply to services provided by <b>{biz}</b> (“the Salon”) and to the use of the SalonX salon management system by
        the Salon's owner and staff. By taking a service or using SalonX, you agree to these Terms.
      </p>

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wider text-brass-dark">Part A — For customers</h2>

      <H n={1}>Services and prices</H>
      <UL items={[
        "Prices shown at the Salon are in Indian Rupees and include applicable taxes unless stated otherwise.",
        "Prices may change without notice; the price confirmed at billing is final.",
        "The final service may vary from the request depending on hair/skin condition and time available; our staff will explain before starting.",
      ]} />

      <H n={2}>Payment</H>
      <UL items={[
        "Payment is due on completion of the service, by cash, UPI or card.",
        "“Credit” bills, where allowed, must be cleared within the time agreed with the Salon.",
        "A bill is generated for every visit and can be sent to you on WhatsApp on request.",
      ]} />

      <H n={3}>Health, allergies and safety</H>
      <UL items={[
        "Please tell us about any allergy, skin condition, recent treatment or sensitivity before a service. A patch test is recommended before colour or chemical treatments.",
        "The Salon is not responsible for reactions arising from conditions that were not disclosed, or from not following after-care advice.",
        "Staff may refuse or stop a service if it appears unsafe.",
      ]} />

      <H n={4}>Satisfaction and complaints</H>
      <UL items={[
        "If you are not happy with a service, tell us during or within 48 hours of the visit; we will try to correct it free of charge where reasonable.",
        "Refunds are not given for services already performed, except where required by law.",
      ]} />

      <H n={5}>Conduct and belongings</H>
      <UL items={[
        "Please keep your valuables with you; the Salon is not responsible for loss of personal belongings.",
        "The Salon may refuse service in case of abusive or unsafe behaviour.",
      ]} />

      <H n={6}>Messages</H>
      <p>
        With your consent, the Salon may send you bills, reminders, wishes and offers on WhatsApp/SMS. You can stop these any time
        by replying STOP or telling us. See the <a className="text-brass-dark underline" href="/consent">Consent</a> and{" "}
        <a className="text-brass-dark underline" href="/privacy">Privacy Policy</a> pages.
      </p>

      <h2 className="pt-4 text-sm font-semibold uppercase tracking-wider text-brass-dark">Part B — For staff using SalonX</h2>

      <H n={7}>Accounts and access</H>
      <UL items={[
        "Access is given by the owner. Each person must use their own login and must not share it.",
        "Access is role-based: Owner (full), Manager (billing, customers, attendance, expenses, purchases) and Barber (own work, attendance and salary only).",
        "Access ends when employment ends or when the owner removes it.",
      ]} />

      <H n={8}>Proper use</H>
      <UL items={[
        "Enter bills, attendance and expenses truthfully and promptly.",
        "Use customer data only to serve customers of the Salon. Do not copy, export, sell or share it, or contact customers for personal purposes.",
        "Send promotional messages only to customers who have given consent.",
        "Report any mistake, suspected misuse or data leak to the owner immediately.",
      ]} />

      <H n={9}>Salary records</H>
      <p>
        Salary in SalonX is calculated from attendance, monthly salary, commission, bonus and advances (upad) as entered. The owner's
        final payment record prevails in case of any dispute, which should be raised within 7 days of the salary date.
      </p>

      <h2 className="pt-4 text-sm font-semibold uppercase tracking-wider text-brass-dark">Part C — General</h2>

      <H n={10}>Liability</H>
      <p>
        SalonX is provided “as is”. To the extent permitted by law, the Salon is not liable for indirect losses, or for interruption
        caused by internet, hosting or third-party service outages.
      </p>

      <H n={11}>Governing law</H>
      <p>These Terms are governed by the laws of India. Courts at {s.city || "the Salon's city"} shall have exclusive jurisdiction.</p>

      <H n={12}>Changes and contact</H>
      <p>
        We may update these Terms; the latest version is always on this page. Questions: {biz}
        {s.salon_address ? <>, {s.salon_address}</> : null}
        {s.contact_email ? <> · {s.contact_email}</> : null}
        {s.salon_phone ? <> · {s.salon_phone}</> : null}.
      </p>
    </LegalDoc>
  );
}
