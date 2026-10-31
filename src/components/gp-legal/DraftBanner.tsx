export function DraftBanner({ note }: { note?: string }) {
  return (
    <div
      role="note"
      className="mb-3 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-400/10 px-3 py-2 text-xs sm:mb-6 sm:px-4 sm:py-3 sm:text-sm font-semibold text-yellow-200"
    >
      DRAFT — not legal advice. Requires attorney review before use. Bracketed
      items like <Ph>[ENTITY NAME]</Ph> are open decisions.
      {note ? <span className="mt-1 block font-normal">{note}</span> : null}
    </div>
  );
}

/** Visible placeholder chip for an open item. */
export function Ph({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-fuchsia-500/25 px-1 font-mono text-[0.95em] text-fuchsia-200 ring-1 ring-fuchsia-400/60">
      {children}
    </mark>
  );
}

/** Inline DRAFT block for merging draft legal copy into an existing page. */
export function DraftSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-draft="true" className="rounded-lg border-2 border-dashed border-yellow-400/80 bg-yellow-400/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-yellow-300">DRAFT — pending attorney review</p>
      <h2 className="mt-1 font-semibold text-white">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
