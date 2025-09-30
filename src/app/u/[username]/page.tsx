import Link from "next/link";
import { notFound } from "next/navigation";

import { GitHubCard } from "@/components/profile/github-card";
import { LeetCodeCard } from "@/components/profile/leetcode-card";
import { CodeforcesCard } from "@/components/profile/codeforces-card";
import { getCodeforcesPreview, getGitHubPreview, getLeetCodePreview } from "@/lib/integrations";
import { findUserByUsername } from "@/lib/users";

type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const user = await findUserByUsername(params.username);

  if (!user) {
    notFound();
  }

  const displayName = user.name ?? user.username ?? params.username;
  const [githubPreview, leetCodePreview, codeforcesPreview] = await Promise.all([
    getGitHubPreview(user),
    getLeetCodePreview(user),
    getCodeforcesPreview(user),
  ]);

  const totalIntegrations = 3;
  const connectedIntegrations = [githubPreview, leetCodePreview, codeforcesPreview].filter(
    (preview) => preview.status === "connected"
  ).length;
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
  const profileSlug = `u/${params.username}`;

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
            AyyCode pulls together contributions across coding platforms. Link services from your
            dashboard to turn this space into a living portfolio of your progress, contests, and
            repositories.
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

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[#0f172a]">Connected platforms</h2>
          <p className="text-sm text-neutral-500">
            Stats update automatically once a service is linked. Until then, use the connect prompts
            to wire everything up.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GitHubCard data={githubPreview} />
          <LeetCodeCard data={leetCodePreview} />
          <CodeforcesCard data={codeforcesPreview} />
        </div>
      </section>
    </main>
  );
}