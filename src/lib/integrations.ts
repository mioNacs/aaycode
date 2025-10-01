import type { UserWithId } from "./users";
import { getGitHubStatsForUser } from "./github/cache";
import { getLeetCodeStatsForUser } from "./leetcode/cache";
import { getCodeforcesStatsForUser } from "./codeforces/cache";
import { getCodechefStatsForUser } from "./codechef/cache";
import { getGeeksforgeeksStatsForUser } from "./geeksforgeeks/cache";

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
const CODEFORCES_STATS_MAX_AGE_HOURS = 6;
const CODECHEF_STATS_MAX_AGE_HOURS = 12;
const GFG_STATS_MAX_AGE_HOURS = 12;

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

  const fetchFailed = Boolean(connection.username && !stats);
  const status: IntegrationStatus = fetchFailed ? "error" : "connected";
  const errorNote = fetchFailed ? "Could not load stats." : undefined;

  return {
    status,
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
    note: errorNote,
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

  const fetchFailed = Boolean(connection.username && !stats);
  const status: IntegrationStatus = fetchFailed ? "error" : "connected";
  const errorNote = fetchFailed ? "Could not load stats." : undefined;

  return {
    status,
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
    note: errorNote,
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

  const stats = connection.handle
    ? await getCodeforcesStatsForUser(
        user._id.toString(),
        connection.handle,
        CODEFORCES_STATS_MAX_AGE_HOURS
      )
    : null;

  const fetchFailed = Boolean(connection.handle && !stats);
  const status: IntegrationStatus = fetchFailed ? "error" : "connected";
  const errorNote = fetchFailed ? "Could not load stats." : undefined;

  return {
    status,
    username: connection.handle,
    stats: [
      {
        label: "Current rating",
        value:
          stats?.rating !== undefined && stats?.rating !== null
            ? stats.rating.toString()
            : connection.rating
            ? connection.rating.toString()
            : "—",
      },
      {
        label: "Max rating",
        value:
          stats?.maxRating !== undefined && stats?.maxRating !== null
            ? stats.maxRating.toString()
            : connection.maxRating
            ? connection.maxRating.toString()
            : "—",
      },
      {
        label: "Rank",
        value: stats?.rank ?? connection.rank ?? "—",
        helper:
          stats?.lastContestName && stats.lastContestDate
            ? `${stats.lastContestName} · ${new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
              }).format(stats.lastContestDate)}`
            : undefined,
      },
      {
        label: "Friends",
        value:
          stats?.friendOfCount !== undefined && stats?.friendOfCount !== null
            ? formatCount(stats.friendOfCount)
            : "—",
      },
    ],
    lastSyncedAt: normalizeDate(stats?.fetchedAt ?? connection.lastSyncedAt ?? connection.lastContestAt),
    note: errorNote,
  };
}

export async function getCodechefPreview(user: UserWithId): Promise<IntegrationPreview> {
  const connection = user.connections?.codechef;

  if (!connection) {
    return {
      status: "disconnected",
      stats: [
        { label: "Rating", value: "—" },
        { label: "Highest rating", value: "—" },
        { label: "Global rank", value: "—" },
        { label: "Fully solved", value: "—" },
      ],
      note: "Connect your CodeChef account to show ratings, stars, and solved problems.",
    };
  }

  const stats = connection.username
    ? await getCodechefStatsForUser(
        user._id.toString(),
        connection.username,
        CODECHEF_STATS_MAX_AGE_HOURS
      )
    : null;

  const fetchFailed = Boolean(connection.username && !stats);
  const status: IntegrationStatus = fetchFailed ? "error" : "connected";
  const errorNote = fetchFailed ? "Could not load stats." : undefined;

  const rating = stats?.rating ?? connection.rating;
  const highestRating = stats?.highestRating ?? connection.highestRating;
  const globalRank = stats?.globalRank ?? connection.globalRank;
  const countryRank = stats?.countryRank ?? connection.countryRank;
  const fullySolved = stats?.fullySolved ?? connection.fullySolved;
  const partiallySolved = stats?.partiallySolved ?? connection.partiallySolved;
  const stars = stats?.stars ?? connection.stars;

  return {
    status,
    username: connection.username,
    stats: [
      {
        label: "Rating",
        value: rating !== undefined && rating !== null ? rating.toString() : "—",
        helper: stars ?? undefined,
      },
      {
        label: "Highest rating",
        value:
          highestRating !== undefined && highestRating !== null
            ? highestRating.toString()
            : "—",
      },
      {
        label: "Global rank",
        value: globalRank ? `#${formatCount(globalRank)}` : "—",
        helper: countryRank ? `Country #${formatCount(countryRank)}` : undefined,
      },
      {
        label: "Fully solved",
        value: fullySolved !== undefined && fullySolved !== null ? formatCount(fullySolved) : "—",
        helper:
          partiallySolved !== undefined && partiallySolved !== null
            ? `Partial ${formatCount(partiallySolved)}`
            : undefined,
      },
    ],
    lastSyncedAt: normalizeDate(stats?.fetchedAt ?? connection.lastSyncedAt),
    note: errorNote,
  };
}

export async function getGeeksforgeeksPreview(user: UserWithId): Promise<IntegrationPreview> {
  const connection = user.connections?.geeksforgeeks;

  if (!connection) {
    return {
      status: "disconnected",
      stats: [
        { label: "Coding score", value: "—" },
        { label: "Problems solved", value: "—" },
        { label: "Institute rank", value: "—" },
        { label: "Current streak", value: "—" },
      ],
      note: "Connect GeeksforGeeks to display coding score, ranks, and streak information.",
    };
  }

  const stats = connection.username
    ? await getGeeksforgeeksStatsForUser(
        user._id.toString(),
        connection.username,
        GFG_STATS_MAX_AGE_HOURS
      )
    : null;

  const fetchFailed = Boolean(connection.username && !stats);
  const status: IntegrationStatus = fetchFailed ? "error" : "connected";
  const errorNote = fetchFailed ? "Could not load stats." : undefined;

  const codingScore = stats?.codingScore ?? connection.codingScore;
  const totalProblemsSolved = stats?.totalProblemsSolved ?? connection.totalProblemsSolved;
  const instituteRank = stats?.instituteRank ?? connection.instituteRank;
  const schoolRank = stats?.schoolRank ?? connection.schoolRank;
  const streak = stats?.streak ?? connection.streak;

  return {
    status,
    username: connection.username,
    stats: [
      {
        label: "Coding score",
        value: codingScore !== undefined && codingScore !== null ? formatCount(codingScore) : "—",
      },
      {
        label: "Problems solved",
        value:
          totalProblemsSolved !== undefined && totalProblemsSolved !== null
            ? formatCount(totalProblemsSolved)
            : "—",
      },
      {
        label: "Institute rank",
        value: instituteRank ? `#${formatCount(instituteRank)}` : "—",
        helper: schoolRank ? `School #${formatCount(schoolRank)}` : undefined,
      },
      {
        label: "Current streak",
        value: streak !== undefined && streak !== null ? `${streak}` : "—",
      },
    ],
    lastSyncedAt: normalizeDate(stats?.fetchedAt ?? connection.lastSyncedAt),
    note: errorNote,
  };
}
