import Link from "next/link";
import { RankingsTable } from "@/components/RankingsTable";
import { getBaseUrl } from "@/lib/baseUrl";

function formatResearchTime(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function Home() {
  const base = getBaseUrl();
  let ranking = null;
  let fetchError = null;

  try {
    const res = await fetch(`${base}/api/rankings`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      fetchError = json.error || `Request failed (${res.status})`;
    } else {
      ranking = json.ranking;
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Network error";
  }

  const displayModels = ranking?.models?.length ? ranking.models : null;
  const lastResearched = ranking?.updatedAt;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-[var(--border)] bg-black/15 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-slate-200">
            Cursor Model Rankings
          </span>
          <Link
            href="/admin"
            className="focus-ring rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-[var(--border)] hover:bg-white/5"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_var(--glow)]" />
            Live leaderboard · refreshed weekly
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl text-gradient leading-tight">
            Cursor Model Rankings
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            A weekly leaderboard of coding models available in Cursor—ranked by
            usefulness, speed, and what each is best for.
          </p>
        </section>

        {fetchError ? (
          <div
            role="alert"
            className="glass-panel rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-rose-100"
          >
            <p className="font-semibold">Could not load rankings</p>
            <p className="mt-1 text-sm text-rose-200/80">{fetchError}</p>
          </div>
        ) : null}

        {!fetchError && !displayModels?.length ? (
          <div className="glass-panel rounded-2xl px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-200">No published ranking yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Run the update script or publish a draft from the admin console.
            </p>
          </div>
        ) : null}

        {displayModels?.length ? (
          <section className="space-y-4">
            {lastResearched ? (
              <p className="text-sm text-slate-400">
                Last researched:{" "}
                <span className="text-slate-200">{formatResearchTime(lastResearched)}</span>
              </p>
            ) : null}
            <RankingsTable models={displayModels} />
          </section>
        ) : null}

        <footer className="mt-auto border-t border-[var(--border)] pt-8 text-xs text-slate-500">
          Built with Next.js & DynamoDB · scores are directional, not financial advice.
        </footer>
      </main>
    </div>
  );
}
