"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { RankingsTable } from "@/components/RankingsTable";

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const loadDraft = useCallback(async () => {
    setMessage(null);
    setError(null);
    if (!apiKey.trim()) {
      setError("Enter your admin API key first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rankings/draft", {
        headers: { "x-admin-api-key": apiKey.trim() },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setDraft(null);
        setError(json.error || "Failed to load draft");
        return;
      }
      setDraft(json.draft);
      if (!json.draft) {
        setMessage("No draft found. Run the weekly update script to create one.");
      } else {
        setMessage("Draft loaded.");
      }
    } catch (e) {
      setDraft(null);
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const publish = useCallback(async () => {
    setMessage(null);
    setError(null);
    if (!apiKey.trim()) {
      setError("Enter your admin API key first.");
      return;
    }
    if (!draft?.batchId) {
      setError("Load a draft before publishing.");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/rankings/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": apiKey.trim(),
        },
        body: JSON.stringify({ batchId: draft.batchId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Publish failed");
        return;
      }
      setMessage(`Published batch ${json.batchId} at ${json.publishedAt}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setPublishing(false);
    }
  }, [apiKey, draft]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-black/15 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="text-sm font-semibold text-slate-200">Admin · Draft review</span>
          <Link
            href="/"
            className="focus-ring rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-[var(--border)] hover:bg-white/5"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Review draft ranking</h1>
          <p className="mt-2 text-sm text-slate-400">
            Load the latest draft from DynamoDB, inspect sources, then publish to the homepage.
          </p>
        </div>

        <div className="glass-panel space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Admin API key
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="focus-ring mt-2 w-full rounded-xl border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Matches ADMIN_API_KEY on the server"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDraft}
              disabled={loading}
              className="focus-ring rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 ring-1 ring-sky-400/40 hover:bg-sky-500/30 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load latest draft"}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || !draft}
              className="focus-ring rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 ring-1 ring-emerald-400/35 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish draft"}
            </button>
          </div>
          {draft?.batchId ? (
            <p className="text-xs text-slate-500">
              Batch ID: <span className="font-mono text-slate-300">{draft.batchId}</span>
            </p>
          ) : null}
        </div>

        {message ? (
          <p className="text-sm text-emerald-300" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-300" role="alert">
            {error}
          </p>
        ) : null}

        {draft?.models?.length ? (
          <div className="space-y-4">
            <RankingsTable models={draft.models} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
