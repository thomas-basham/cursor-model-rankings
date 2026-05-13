"use client";

import { Fragment, useState } from "react";

function formatUpdated(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * @param {object} props
 * @param {Array<Record<string, unknown>> | null} props.models
 */
export function RankingsTable({ models }) {
  const [openRank, setOpenRank] = useState(null);

  if (!models?.length) return null;

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-black/20 text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Coding Score</th>
              <th className="px-4 py-3 font-medium">Best For</th>
              <th className="px-4 py-3 font-medium">Speed</th>
              <th className="px-4 py-3 font-medium">Last Updated</th>
              <th className="px-4 py-3 font-medium w-10" aria-label="Expand details" />
            </tr>
          </thead>
          <tbody>
            {models.map((row) => {
              const rank = row.rank;
              const expanded = openRank === rank;
              return (
                <Fragment key={rank}>
                  <tr
                    className="border-b border-[var(--border)]/60 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sky-300 tabular-nums">
                      #{rank}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      {String(row.modelName)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{String(row.provider)}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-300">
                      {row.codingScore}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate" title={String(row.bestFor)}>
                      {String(row.bestFor)}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate" title={String(row.speed ?? row.pricingSummary ?? "")}>
                      {String(row.speed ?? row.pricingSummary ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {formatUpdated(row.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenRank(expanded ? null : rank)}
                        className="focus-ring rounded-lg px-2 py-1 text-xs text-sky-300 hover:bg-sky-500/10"
                        aria-expanded={expanded}
                      >
                        {expanded ? "Close" : "Sources"}
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="bg-black/25">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Best features
                            </p>
                            <ul className="list-disc space-y-1 pl-5 text-slate-300">
                              {(row.strengths || []).map((s, i) => (
                                <li key={`${rank}-s-${i}`}>{String(s)}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Watch out for
                            </p>
                            <ul className="list-disc space-y-1 pl-5 text-slate-300">
                              {(row.weaknesses || []).map((s, i) => (
                                <li key={`${rank}-w-${i}`}>{String(s)}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {row.cursorUsage || row.pricingSummary ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {row.cursorUsage ? (
                              <div className="rounded-lg border border-[var(--border)]/70 bg-black/20 px-3 py-2 text-xs text-slate-300">
                                <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">
                                  Cursor token usage
                                </p>
                                <p>{String(row.cursorUsage)}</p>
                              </div>
                            ) : null}
                            {row.pricingSummary ? (
                              <div className="rounded-lg border border-[var(--border)]/70 bg-black/20 px-3 py-2 text-xs text-slate-300">
                                <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">
                                  Provider pricing
                                </p>
                                <p>{String(row.pricingSummary)}</p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Sources
                          </p>
                          <ul className="flex flex-col gap-2">
                            {(row.sourceUrls || []).map((url, i) => (
                              <li key={`${rank}-u-${i}`}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-300 hover:underline break-all"
                                >
                                  {url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
