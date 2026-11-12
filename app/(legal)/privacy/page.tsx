import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { H, LEGAL_UPDATED, LegalDoc, UL } from "@/components/Legal";

export const metadata: Metadata = { title: "Privacy Policy · SalonX" };

export default async function Privacy() {
  const s = await getSettings();
  const biz = s.owner_name || s.salon_name;
  const contact = [s.contact_email, s.salon_phone].filter(Boolean).join(" · ") || "the salon counter";
  return (
    <LegalDoc title="Privacy Policy" updated={LEGAL_UPDATED}>
      <p>
        This Privacy Policy explains how <b>{biz}</b> (“we”, “us”, “the Salon”) collects, uses, stores and protects personal data
        through the SalonX salon management system. We follow the Digital Personal Data Protection Act, 2023 (DPDP Act) and the
        Information Technology Act, 2000 of India.
      </p>

      <H n={1}>Who this policy covers</H>
      <UL items={[
        <><b>Customers</b> who visit the Salon and whose details are entered at billing.</>,
        <><b>Staff</b> (barbers, managers and other employees) whose work, attendance and salary records are kept in SalonX.</>,
      ]} />

      <H n={2}>Data we collect</H>
      <p><b>Customers:</b></p>
      <UL items={[
        "Name and mobile number",
        "Optional: gender, birthday, anniversary, area/address",
        "Visit history — date, services taken, barber who served, seat, amount, discount and payment mode",
        "Notes about preferences (for example hair type, colour shade used, product sensitivities you tell us about)",
        "Your consent choice for WhatsApp / SMS messages and the date it was given",
      ]} />
      <p><b>Staff:</b></p>
      <UL items={[
        "Name, mobile number, login email, designation and joining date",
        "Attendance, services performed and sales credited",
        "Salary, commission, advances (upad), bonus and payment records",
      ]} />
      <p>We do <b>not</b> collect card numbers, bank account details, Aadhaar or other government ID numbers in SalonX.</p>

      <H n={3}>Why we use it</H>
      <UL items={[
        "To create your bill and keep a record of the services you received",
        "To remember your preferences and the barber you like, so your next visit is better",
        "To send your bill on WhatsApp when you ask for it",
        "Only if you consent: to send visit reminders, birthday/anniversary wishes and offers",
        "For staff: to manage attendance, calculate salary and commission, and run the Salon",
        "To meet accounting, tax and other legal obligations",
      ]} />

      <H n={4}>Legal basis</H>
      <p>
        We process customer data on the basis of your <b>consent</b> and for the <b>legitimate use</b> of providing the service you
        asked for (DPDP Act, Sections 6 and 7). Promotional messages are sent only with your separate, specific consent, which you
        can withdraw at any time.
      </p>

      <H n={5}>Who we share it with</H>
      <p>We do not sell or rent your personal data. It is shared only with service providers who help us run SalonX:</p>
      <UL items={[
        <><b>Railway</b> — secure cloud hosting of the app and database.</>,
        <><b>Clerk</b> — secure sign-in for Salon staff (customers do not log in).</>,
        <><b>WhatsApp (Meta)</b> — only when a message is sent to you from the Salon's own WhatsApp.</>,
        "Government authorities, only when required by law.",
      ]} />
      <p>Our service providers may store data on servers outside India, with security safeguards, as permitted by the DPDP Act.</p>

      <H n={6}>How long we keep it</H>
      <p>
        Customer records are kept while you continue to visit, and deleted or anonymised within <b>3 years</b> of your last visit,
        or sooner if you ask. Bills and staff salary records are kept for up to <b>8 years</b> as required under Indian tax and
        accounting laws.
      </p>

      <H n={7}>Security</H>
      <p>
        Data is stored in a password-protected database with encrypted (HTTPS) connections. Only signed-in Salon staff can see it,
        and access depends on their role — barbers can see only their own work and salary, not customer lists or other staff salaries.
      </p>

      <H n={8}>Your rights</H>
      <p>Under the DPDP Act you can:</p>
      <UL items={[
        "Ask what personal data we hold about you and how it is used",
        "Ask us to correct or update wrong or incomplete details",
        "Ask us to delete your data (except records we must keep by law)",
        "Withdraw consent for WhatsApp / SMS messages at any time — just reply STOP or tell us at the counter",
        "Nominate another person to exercise these rights on your behalf",
        "Raise a complaint with our grievance contact, and then with the Data Protection Board of India",
      ]} />

      <H n={9}>Children</H>
      <p>For customers under 18 years, details are entered only with the consent of a parent or guardian, and no promotional messages are sent to them.</p>

      <H n={10}>Grievance contact</H>
      <p>
        For any question, correction, deletion request or complaint, contact <b>{biz}</b>
        {s.salon_address ? <>, {s.salon_address}</> : null} — {contact}. We will respond within 30 days.
      </p>

      <H n={11}>Changes</H>
      <p>We may update this policy. The latest version will always be available on this page with its “Last updated” date.</p>
    </LegalDoc>
  );
}
