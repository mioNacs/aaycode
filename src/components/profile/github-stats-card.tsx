import Link from "next/link";
import { FiExternalLink, FiGithub } from "react-icons/fi";

import type { GitHubStats } from "@/lib/github/api";
import type { GitHubConnection } from "@/lib/users";

type GitHubStatsCardProps = {
  connection?: GitHubConnection | null;
  stats: GitHubStats | null;
};

const formatNumber = (value: number): string =>
  Intl.NumberFormat("en", { notation: "compact" }).format(value);

export function GitHubStatsCard({ connection, stats }: GitHubStatsCardProps) {
  const isConnected = Boolean(connection);

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
      <div className="space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <FiGithub className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">GitHub</h3>
              <p className="text-xs uppercase tracking-wide text-neutral-400">
                Open-source activity snapshot
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </header>

        {isConnected ? (
          stats ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Public repos</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                    {formatNumber(stats.publicRepos)}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Followers</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                    {formatNumber(stats.followers)}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Total stars</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                    {formatNumber(stats.totalStars)}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Visible repos</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                    {formatNumber(stats.repoCount)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Top languages</p>
                {stats.topLanguages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {stats.topLanguages.map((language) => (
                      <span
                        key={language.name}
                        className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                        title={`${language.count} repos, ${language.stars} stars`}
                      >
                        {language.name} · {language.percentage}%
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Your language mix will appear here once stats are available.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              We couldn&apos;t load GitHub stats right now. Please try refreshing the page.
            </p>
          )
        ) : (
          <p className="text-sm text-neutral-500">
            Connect GitHub from your dashboard to showcase repositories, followers, and favourite languages here.
          </p>
        )}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-2 text-sm text-neutral-600">
        {connection?.username ? (
          <p className="font-medium text-neutral-700">@{connection.username}</p>
        ) : (
          <span />
        )}
        {stats?.profileUrl ? (
          <Link
            className="inline-flex items-center gap-1 rounded-full border border-teal-200 px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700"
            href={stats.profileUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
            <FiExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
