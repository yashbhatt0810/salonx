export function LegalDoc({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="card p-6 md:p-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-black/50">Last updated: {updated}</p>
      <div className="legal mt-6 space-y-4 text-[15px] leading-relaxed text-black/80">{children}</div>
    </article>
  );
}

export function H({ n, children }: { n: number; children: React.ReactNode }) {
  return <h2 className="pt-3 text-lg font-semibold text-ink">{n}. {children}</h2>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return <ul className="list-disc space-y-1 pl-6">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
}

export const LEGAL_UPDATED = "12 November 2026";
