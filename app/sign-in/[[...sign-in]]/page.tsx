import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-4">
      <div className="font-display text-4xl font-semibold text-white">Salon<span className="text-brass">X</span></div>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <SignIn /> : <p className="text-white/70">Login is not configured yet.</p>}
    </div>
  );
}
