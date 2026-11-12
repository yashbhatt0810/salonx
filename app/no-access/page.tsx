import { SignOutButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function NoAccess() {
  const clerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-6 text-center">
        <div className="font-display text-2xl font-semibold">Access pending</div>
        <p className="mt-2 text-sm text-black/60">
          You are signed in, but this email is not linked to SalonX yet. Ask the owner to add your email in
          <b> Staff</b> and tick <b>Can login</b>.
        </p>
        {clerk && <div className="mt-5"><SignOutButton><button className="btn-ghost">Sign out</button></SignOutButton></div>}
      </div>
    </div>
  );
}
