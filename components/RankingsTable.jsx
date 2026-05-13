"use client";

import { Fragment, useState } from "react";

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
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-black/20 text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 align-top font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Coding Score</th>
              <th className="px-4 py-3 align-top font-medium">Best For</th>
              <th className="px-4 py-3 font-medium">Speed</th>
              <th className="px-4 py-3 align-top font-medium">Token usage</th>
            </tr>
          </thead>
          <tbody>
            {models.map((row) => {
              const rank = row.rank;
              const expanded = openRank === rank;
              return (
                <Fragment key={rank}>
                  <tr
                    tabIndex={0}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? "Collapse" : "Expand"} details for ${String(row.modelName)}`}
                    onClick={() => setOpenRank(expanded ? null : rank)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenRank(expanded ? null : rank);
                      }
                    }}
                    className={`cursor-pointer border-b border-[var(--border)]/60 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-inset ${expanded ? "bg-white/[0.04]" : ""}`}
                  >
                    <td className="px-4 py-3 align-top font-mono text-sky-300 tabular-nums">
                      #{rank}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-100">
                        {String(row.modelName)}
                      </div>
                      <div className="mt-0.5 text-slate-400">{String(row.provider)}</div>
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums text-emerald-300">
                      {row.codingScore}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-300 whitespace-normal break-words">
                      {String(row.bestFor)}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-300 max-w-[160px] truncate" title={String(row.speed ?? row.pricingSummary ?? "")}>
                      {String(row.speed ?? row.pricingSummary ?? "—")}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-300 whitespace-normal break-words max-w-[220px]">
                      {row.cursorUsage ? String(row.cursorUsage) : "—"}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="bg-black/25">
                      <td colSpan={6} className="px-4 py-4">
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
                        {row.pricingSummary ? (
                          <div className="mt-4 max-w-xl rounded-lg border border-[var(--border)]/70 bg-black/20 px-3 py-2 text-xs text-slate-300">
                            <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">
                              Provider pricing
                            </p>
                            <p>{String(row.pricingSummary)}</p>
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
