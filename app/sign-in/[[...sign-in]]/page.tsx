import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-4">
      <div className="font-display text-4xl font-semibold text-white">Salon<span className="text-brass">X</span></div>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <SignIn /> : <p className="text-white/70">Login is not configured yet.</p>}
      <p className="max-w-sm text-center text-xs text-white/45">
        By continuing you agree to the <a href="/terms" className="underline hover:text-white">Terms &amp; Conditions</a>,{" "}
        <a href="/privacy" className="underline hover:text-white">Privacy Policy</a> and{" "}
        <a href="/consent" className="underline hover:text-white">Consent</a>.
      </p>
    </div>
  );
}
