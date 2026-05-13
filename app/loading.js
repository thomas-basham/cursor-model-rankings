export default function Loading() {
  return (
    <div className="flex flex-1 flex-col animate-pulse">
      <header className="border-b border-[var(--border)] bg-black/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="h-4 w-36 rounded bg-slate-700" />
          <div className="h-8 w-20 rounded-lg bg-slate-800" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-12 sm:px-6">
        <div className="h-6 w-40 rounded-full bg-slate-800" />
        <div className="h-12 max-w-xl rounded bg-slate-800" />
        <div className="h-20 max-w-2xl rounded bg-slate-800/80" />
        <div className="glass-panel h-96 rounded-2xl bg-slate-900/50" />
      </main>
    </div>
  );
}
