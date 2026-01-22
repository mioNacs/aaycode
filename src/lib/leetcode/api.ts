import { buildLeetCodeHeaders, LEETCODE_GRAPHQL_ENDPOINT } from "./client";

const EXTERNAL_LEETCODE_API = "https://alfa-leetcode-api.onrender.com";

const graphqlQuery = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      githubUrl
      profile {
        realName
        userAvatar
        ranking
        starRating
        reputation
        countryName
      }
      userCalendar {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      badges {
        id
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      attendedContestsCount
      totalParticipants
      topPercentage
    }
  }
`;

type SubmissionStat = {
  difficulty: "All" | "Easy" | "Medium" | "Hard" | string;
  count: number;
  submissions: number;
};

type MatchedUser = {
  username: string;
  githubUrl?: string | null;
  profile?: {
    realName?: string | null;
    userAvatar?: string | null;
    ranking?: number | null;
    starRating?: number | null;
    reputation?: number | null;
    countryName?: string | null;
  } | null;
  userCalendar?: {
    activeYears?: number[];
    streak?: number;
    totalActiveDays?: number;
    submissionCalendar?: string;
  } | null;
  submitStats?: {
    acSubmissionNum: SubmissionStat[];
  } | null;
  badges?: Array<{ id: string } | null> | null;
};

type UserContestRanking = {
  rating?: number | null;
  globalRanking?: number | null;
  attendedContestsCount?: number | null;
  totalParticipants?: number | null;
  topPercentage?: number | null;
} | null;

type GraphQLResponse = {
  data?: {
    matchedUser?: MatchedUser | null;
    userContestRanking?: UserContestRanking;
  };
  errors?: Array<{ message?: string }>;
};

export type LeetCodeStats = {
  username: string;
  displayName?: string | null;
  profileUrl: string;
  avatarUrl?: string | null;
  country?: string | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  contestRating?: number | null;
  contestGlobalRanking?: number | null;
  contestTopPercentage?: number | null;
  contestsAttended?: number | null;
  ranking?: number | null;
  badges?: number | null;
  reputation?: number | null;
  githubUrl?: string | null;
  streak?: number;
  totalActiveDays?: number;
  activeYears?: number[];
  submissionCalendar?: Record<string, number>;
  fetchedAt: Date;
};

const defaultStats = {
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  totalSubmissions: 0,
};

const sumSubmissionStats = (stats?: SubmissionStat[] | null) => {
  if (!stats) {
    return defaultStats;
  }

  const result = { ...defaultStats };

  stats.forEach((entry) => {
    const count = entry?.count ?? 0;

    switch (entry?.difficulty) {
      case "All":
        result.totalSolved = count;
        result.totalSubmissions = entry.submissions ?? result.totalSubmissions;
        break;
      case "Easy":
        result.easySolved = count;
        break;
      case "Medium":
        result.mediumSolved = count;
        break;
      case "Hard":
        result.hardSolved = count;
        break;
      default:
        break;
    }
  });

  return result;
};

export async function fetchLeetCodeStatsFromApi(
  username: string
): Promise<LeetCodeStats | null> {
  const normalized = username.trim();
  if (!normalized) {
    return null;
  }

  if (!process.env.LEETCODE_SESSION || !process.env.LEETCODE_CSRF_TOKEN) {
    console.warn(
      "[leetcode] Missing LEETCODE_SESSION or LEETCODE_CSRF_TOKEN. Direct GraphQL request might fail."
    );
  }

  try {
    const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: buildLeetCodeHeaders(),
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { username: normalized },
      }),
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn(
          `[leetcode] Unauthorized or Forbidden (${response.status}). Attempting fallback...`
        );
        return await fetchLeetCodeStatsFromExternalApi(normalized);
      }
      const errorBody = await response.text();
      console.warn(
        `LeetCode API request failed (${response.status}): ${errorBody}. Attempting fallback...`
      );
      return await fetchLeetCodeStatsFromExternalApi(normalized);
    }

    const body: GraphQLResponse = await response.json();

    if (body.errors?.length) {
      const errorMsg = body.errors.map((e) => e.message).join("; ");
      console.warn(`[leetcode] GraphQL errors: ${errorMsg}. Attempting fallback...`);
      return await fetchLeetCodeStatsFromExternalApi(normalized);
    }

    const matchedUser = body.data?.matchedUser;

    if (!matchedUser) {
      return null;
    }

    const submissionTotals = sumSubmissionStats(matchedUser.submitStats?.acSubmissionNum);
    const contest = body.data?.userContestRanking;

    let parsedCalendar: Record<string, number> | undefined;
    try {
      if (matchedUser.userCalendar?.submissionCalendar) {
        parsedCalendar = JSON.parse(matchedUser.userCalendar.submissionCalendar);
      }
    } catch (e) {
      console.warn("[leetcode] Failed to parse submissionCalendar", e);
    }

    return {
      username: matchedUser.username,
      displayName: matchedUser.profile?.realName ?? null,
      profileUrl: `https://leetcode.com/${matchedUser.username}/`,
      avatarUrl: matchedUser.profile?.userAvatar ?? null,
      country: matchedUser.profile?.countryName ?? null,
      ranking: matchedUser.profile?.ranking ?? null,
      reputation: matchedUser.profile?.reputation ?? null,
      githubUrl: matchedUser.githubUrl ?? null,
      badges: matchedUser.badges?.length ?? 0,
      contestRating: contest?.rating ?? null,
      contestGlobalRanking: contest?.globalRanking ?? null,
      contestTopPercentage: contest?.topPercentage ?? null,
      contestsAttended: contest?.attendedContestsCount ?? null,
      totalSolved: submissionTotals.totalSolved,
      easySolved: submissionTotals.easySolved,
      mediumSolved: submissionTotals.mediumSolved,
      hardSolved: submissionTotals.hardSolved,
      totalSubmissions: submissionTotals.totalSubmissions,
      streak: matchedUser.userCalendar?.streak,
      totalActiveDays: matchedUser.userCalendar?.totalActiveDays,
      activeYears: matchedUser.userCalendar?.activeYears,
      submissionCalendar: parsedCalendar,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("[leetcode] Failed to fetch stats via GraphQL", error);
    return await fetchLeetCodeStatsFromExternalApi(normalized);
  }
}

async function fetchLeetCodeStatsFromExternalApi(
  username: string
): Promise<LeetCodeStats | null> {
  try {
    const response = await fetch(`${EXTERNAL_LEETCODE_API}/${username}`);
    if (!response.ok) {
      console.warn(`[leetcode] External API failed (${response.status})`);
      return null;
    }
    const data = await response.json();

    let parsedCalendar = data.submissionCalendar;
    if (typeof parsedCalendar === "string") {
      try {
        parsedCalendar = JSON.parse(parsedCalendar);
      } catch {}
    }

    return {
      username: data.username || username,
      displayName: data.name || data.realName || null,
      profileUrl: `https://leetcode.com/${username}/`,
      avatarUrl: data.avatar || data.userAvatar || null,
      country: data.country || null,
      ranking: data.ranking || null,
      reputation: data.reputation || null,
      githubUrl: data.github || data.gitHub || null,
      badges: data.badgesCount || 0,
      contestRating: null,
      contestGlobalRanking: null,
      contestTopPercentage: null,
      contestsAttended: null,
      totalSolved: data.totalSolved || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      totalSubmissions: data.totalSubmissions || 0,
      streak: data.streak || 0,
      totalActiveDays: data.totalActiveDays || 0,
      submissionCalendar: parsedCalendar,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("[leetcode] External API error", error);
    return null;
  }
}
