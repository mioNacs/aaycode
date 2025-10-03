import { buildLeetCodeHeaders, LEETCODE_GRAPHQL_ENDPOINT } from "./client";

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
  try {
    const normalized = username.trim();

    if (!normalized) {
      return null;
    }

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
      const errorBody = await response.text();
      if (response.status === 401 || response.status === 403) {
        console.warn(
          "[leetcode] Stats request unauthorized. Ensure LEETCODE_SESSION/LEETCODE_CSRF_TOKEN env vars are set."
        );
      }
      throw new Error(
        `LeetCode API request failed (${response.status}): ${errorBody}`
      );
    }

    const body: GraphQLResponse = await response.json();

    if (body.errors?.length) {
      throw new Error(body.errors.map((err) => err?.message ?? "Unknown error").join("; "));
    }

    const matchedUser = body.data?.matchedUser;

    if (!matchedUser) {
      return null;
    }

    const submissionTotals = sumSubmissionStats(matchedUser.submitStats?.acSubmissionNum);
    const contest = body.data?.userContestRanking;

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
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("[leetcode] Failed to fetch stats", error);
    return null;
  }
}
