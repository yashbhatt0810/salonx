import Link from "next/link";
export default function NotFound() {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3"><div className="font-display text-2xl">Not found</div><Link href="/" className="btn-ghost">Back to dashboard</Link></div>;
}
