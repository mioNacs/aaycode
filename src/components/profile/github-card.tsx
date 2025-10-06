import { FiExternalLink, FiGithub, FiStar } from "react-icons/fi";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";
import { PlatformHeatmap } from "./platform-heatmap";

type GitHubCardProps = {
  data: IntegrationPreview;
};

export function GitHubCard({ data }: GitHubCardProps) {
  const topRepositories = data.topRepositories ?? [];
  const contributionSeries = data.contributionSeries;
  const starFormatter = new Intl.NumberFormat("en", { notation: "compact" });
  const updatedFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const detailContent = (topRepositories.length || contributionSeries)
    ? (
        <div className="space-y-6">
          {contributionSeries ? (
            <PlatformHeatmap platformName="GitHub" series={contributionSeries} />
          ) : null}
          
          {topRepositories.length ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Top repositories
              </h4>
              <div className="space-y-3">
                {topRepositories.map((repo) => {
                  const updatedLabel = repo.updatedAt
                    ? updatedFormatter.format(
                        repo.updatedAt instanceof Date ? repo.updatedAt : new Date(repo.updatedAt)
                      )
                    : null;

                  return (
                    <article
                      key={repo.url ?? repo.name}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <a
                            className="inline-flex items-center gap-1 text-base font-semibold text-[#0f172a] underline-offset-2 hover:underline"
                            href={repo.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {repo.name}
                            <FiExternalLink className="h-4 w-4 text-neutral-400" />
                          </a>
                          {repo.description ? (
                            <p className="text-sm text-neutral-600">{repo.description}</p>
                          ) : null}
                        </div>
                        <span className="inline-flex items-center gap-1 self-start rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                          <FiStar className="h-4 w-4" />
                          {starFormatter.format(repo.stars ?? 0)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        {repo.language ? <span>{repo.language}</span> : null}
                        {updatedLabel ? <span>Updated {updatedLabel}</span> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )
    : undefined;

  return (
    <IntegrationCard
      icon={<FiGithub className="h-5 w-5" />}
      title="GitHub"
      description="Repositories, stars, followers"
      status={data.status}
      username={data.username}
      stats={data.stats}
      note={data.note}
      lastSyncedAt={data.lastSyncedAt}
      avatarUrl={data.avatarUrl}
      profileUrl={data.profileUrl}
      insights={data.insights}
      detailContent={detailContent}
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect GitHub",
        href:
          data.status === "connected"
            ? data.profileUrl ?? (data.username ? `https://github.com/${data.username}` : "/dashboard")
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.profileUrl ?? data.username),
      }}
    />
  );
}
