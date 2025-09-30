import type { UserWithId } from "./users";
import { getGitHubStatsForUser } from "./github/cache";
import { getLeetCodeStatsForUser } from "./leetcode/cache";

export type IntegrationStatus = "connected" | "disconnected" | "error";

export type StatItem = {
  label: string;
  value: string;
  helper?: string;
};

export type IntegrationPreview = {
  status: IntegrationStatus;
  username?: string;
  stats: StatItem[];
  note?: string;
  lastSyncedAt?: Date | null;
};

const formatCount = (value?: number): string => {
  if (value === undefined || value === null) {
    return "—";
  }

  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
};

const GITHUB_STATS_MAX_AGE_HOURS = 12;
const LEETCODE_STATS_MAX_AGE_HOURS = 12;

const normalizeDate = (value?: Date | null): Date | null => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

export async function getGitHubPreview(user: UserWithId): Promise<IntegrationPreview> {
  const connection = user.connections?.github;

  if (!connection) {
    return {
      status: "disconnected",
      stats: [
        { label: "Public repos", value: "—" },
        { label: "Total stars", value: "—" },
        { label: "Followers", value: "—" },
      ],
      note: "Connect your GitHub account to see repositories, stars, and follower trends.",
    };
  }

  const stats = connection.username
    ? await getGitHubStatsForUser(
        user._id.toString(),
        connection.username,
        GITHUB_STATS_MAX_AGE_HOURS
      )
    : null;

  return {
    status: "connected",
    username: connection.username,
    stats: [
      {
        label: "Public repos",
        value: formatCount(stats?.publicRepos ?? connection.publicRepos),
      },
      {
        label: "Total stars",
        value: formatCount(stats?.totalStars ?? connection.totalStars),
      },
      {
        label: "Followers",
        value: formatCount(stats?.followers ?? connection.followers),
      },
      {
        label: "Top language",
        value: stats?.topLanguages[0]?.name ?? connection.topLanguage ?? "—",
      },
    ],
    lastSyncedAt: normalizeDate(stats?.fetchedAt ?? connection.lastSyncedAt),
  };
}

export async function getLeetCodePreview(user: UserWithId): Promise<IntegrationPreview> {
  const connection = user.connections?.leetcode;

  if (!connection) {
    return {
      status: "disconnected",
      stats: [
        { label: "Total solved", value: "—" },
        { label: "Contest rating", value: "—" },
        { label: "Global rank", value: "—" },
      ],
      note: "Connect your LeetCode account to display solved problems and contest performance.",
    };
  }

  const stats = connection.username
    ? await getLeetCodeStatsForUser(
        user._id.toString(),
        connection.username,
        LEETCODE_STATS_MAX_AGE_HOURS
      )
    : null;

  return {
    status: "connected",
    username: connection.username,
    stats: [
      {
        label: "Total solved",
        value: formatCount(stats?.totalSolved ?? connection.totalSolved),
      },
      {
        label: "Contest rating",
        value:
          stats?.contestRating !== undefined && stats?.contestRating !== null
            ? Math.round(stats.contestRating).toString()
            : connection.contestRating
            ? Math.round(connection.contestRating).toString()
            : "—",
        helper:
          stats?.contestTopPercentage !== undefined && stats?.contestTopPercentage !== null
            ? `Top ${stats.contestTopPercentage.toFixed(1)}%`
            : undefined,
      },
      {
        label: "Global rank",
        value:
          stats?.contestGlobalRanking !== undefined && stats?.contestGlobalRanking !== null
            ? `#${formatCount(stats.contestGlobalRanking)}`
            : connection.ranking
            ? `#${formatCount(connection.ranking)}`
            : "—",
      },
      {
        label: "Badges",
        value: formatCount(stats?.badges ?? connection.badges),
      },
    ],
    lastSyncedAt: normalizeDate(stats?.fetchedAt ?? connection.lastSyncedAt),
  };
}

export async function getCodeforcesPreview(user: UserWithId): Promise<IntegrationPreview> {
  const connection = user.connections?.codeforces;

  if (!connection) {
    return {
      status: "disconnected",
      stats: [
        { label: "Current rating", value: "—" },
        { label: "Max rating", value: "—" },
        { label: "Rank", value: "—" },
      ],
      note: "Connect your Codeforces handle to surface ratings and recent contest placements.",
    };
  }

  return {
    status: "connected",
    username: connection.handle,
    stats: [
      { label: "Current rating", value: connection.rating ? connection.rating.toString() : "—" },
      { label: "Max rating", value: connection.maxRating ? connection.maxRating.toString() : "—" },
      { label: "Rank", value: connection.rank ?? "—" },
    ],
    lastSyncedAt: normalizeDate(connection.lastSyncedAt ?? connection.lastContestAt),
  };
}
