"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="glass-panel max-w-md rounded-2xl border border-rose-500/30 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-rose-100">Something went wrong</h2>
        <p className="mt-2 text-sm text-rose-200/80">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-6 rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-200 ring-1 ring-sky-400/40 hover:bg-sky-500/30"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
