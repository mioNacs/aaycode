import Link from "next/link";
import { notFound } from "next/navigation";

import { ContributionHeatmap } from "@/components/profile/contribution-heatmap";
import { GitHubCard } from "@/components/profile/github-card";
import { LeetCodeCard } from "@/components/profile/leetcode-card";
import { CodeforcesCard } from "@/components/profile/codeforces-card";
import { CodechefCard } from "@/components/profile/codechef-card";
import { GeeksforgeeksCard } from "@/components/profile/geeksforgeeks-card";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import {
  getCodechefPreview,
  getCodeforcesPreview,
  getGeeksforgeeksPreview,
  getGitHubPreview,
  getLeetCodePreview,
} from "@/lib/integrations";
import { getContributionSeriesForUser } from "@/lib/contribution-aggregator";
import { findUserByUsername } from "@/lib/users";
import { getGitHubContributionSeriesForUser } from "@/lib/github/contributions";
import { getLeetCodeContributionSeriesForUser } from "@/lib/leetcode/contributions";
import { getCodeforcesContributionSeriesForUser } from "@/lib/codeforces/contributions";
import { getCodechefContributionSeriesForUser } from "@/lib/codechef/contributions";
import { getGeeksforgeeksContributionSeriesForUser } from "@/lib/geeksforgeeks/contributions";

type ProfilePageParams = {
  username: string;
};

type ProfilePageProps = {
  params: Promise<ProfilePageParams> | ProfilePageParams;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;

  const user = await findUserByUsername(resolvedParams.username);

  if (!user) {
    notFound();
  }

  const displayName = user.name ?? user.username ?? resolvedParams.username;
  const contributionsPromise = getContributionSeriesForUser(user).catch((error) => {
    console.error("[profile] Failed to load contributions", error);
    return null;
  });

  const contributionResult = await contributionsPromise;
  const dateRange = {
    start: contributionResult?.series.startDate ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: contributionResult?.series.endDate ?? new Date().toISOString().split("T")[0],
  };

  const [githubSeries, leetcodeSeries, codeforcesSeries, codechefSeries, gfgSeries] = await Promise.all([
    user.connections?.github?.username
      ? getGitHubContributionSeriesForUser(
          user._id.toString(),
          user.connections.github.username,
          dateRange.start,
          dateRange.end,
        ).catch(() => null)
      : null,
    user.connections?.leetcode?.username
      ? getLeetCodeContributionSeriesForUser(
          user._id.toString(),
          user.connections.leetcode.username,
          dateRange.start,
          dateRange.end,
        ).catch(() => null)
      : null,
    user.connections?.codeforces?.handle
      ? getCodeforcesContributionSeriesForUser(
          user._id.toString(),
          user.connections.codeforces.handle,
          dateRange.start,
          dateRange.end,
        ).catch(() => null)
      : null,
    user.connections?.codechef?.username
      ? getCodechefContributionSeriesForUser(
          user._id.toString(),
          user.connections.codechef.username,
          dateRange.start,
          dateRange.end,
        ).catch(() => null)
      : null,
    user.connections?.geeksforgeeks?.username
      ? getGeeksforgeeksContributionSeriesForUser(
          user._id.toString(),
          user.connections.geeksforgeeks.username,
          dateRange.start,
          dateRange.end,
        ).catch(() => null)
      : null,
  ]);

  const [githubPreview, leetCodePreview, codeforcesPreview, codechefPreview, geeksforgeeksPreview] = await Promise.all([
    getGitHubPreview(user, githubSeries),
    getLeetCodePreview(user, leetcodeSeries),
    getCodeforcesPreview(user, codeforcesSeries),
    getCodechefPreview(user, codechefSeries),
    getGeeksforgeeksPreview(user, gfgSeries),
  ]);

  const contributionWarnings = contributionResult?.warnings ?? [];

  const totalIntegrations = 5;
  const connectedIntegrations = [
    githubPreview,
    leetCodePreview,
    codeforcesPreview,
    codechefPreview,
    geeksforgeeksPreview,
  ].filter((preview) => preview.status === "connected").length;
  const createdAt = user.createdAt
    ? user.createdAt instanceof Date
      ? user.createdAt
      : new Date(user.createdAt)
    : null;
  const joinedLabel = createdAt
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(createdAt)
    : "Recently";
  const profileSlug = `u/${resolvedParams.username}`;

  return (
    <main className="container flex min-h-[70vh] flex-col gap-12 py-16">
      <header className="card space-y-6 p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-teal-500">Public profile</p>
            <h1 className="text-4xl font-semibold text-[#0f172a]">{displayName}</h1>
            <p className="text-sm text-neutral-500">@{user.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-teal-700">
              {connectedIntegrations}/{totalIntegrations} platforms connected
            </span>
            <span className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Joined {joinedLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-neutral-500 md:max-w-2xl">
            AyyCode pulls together contributions across coding platforms. Link services from your dashboard to turn this space into a living portfolio of your progress, contests, and repositories.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-white px-5 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700"
          >
            Manage integrations
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-mono text-neutral-600">
            /{profileSlug}
          </span>
        </div>
      </header>

      <ProfileSummaryCard
        github={githubPreview}
        leetcode={leetCodePreview}
        codeforces={codeforcesPreview}
        codechef={codechefPreview}
        geeksforgeeks={geeksforgeeksPreview}
      />

      {contributionResult && (
        <ContributionHeatmap
          username={displayName}
          series={contributionResult.series}
          warnings={contributionWarnings}
        />
      )}

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[#0f172a]">Connected platforms</h2>
          <p className="text-sm text-neutral-500">
            Stats update automatically once a service is linked. Until then, use the connect prompts to wire everything up.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GitHubCard data={githubPreview} />
          <LeetCodeCard data={leetCodePreview} />
          <CodeforcesCard data={codeforcesPreview} />
          <CodechefCard data={codechefPreview} />
          <GeeksforgeeksCard data={geeksforgeeksPreview} />
        </div>
      </section>
    </main>
  );
}
