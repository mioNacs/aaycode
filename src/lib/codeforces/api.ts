const CODEFORCES_API_ROOT = "https://codeforces.com/api";

const USER_AGENT = "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)";

const SECONDS_TO_MS = 1000;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Codeforces API request failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as { status: string; comment?: string } & T;

  if (json.status !== "OK") {
    throw new Error(json.comment ?? "Codeforces API error");
  }

  return json;
};

type UserInfo = {
  handle: string;
  email?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution?: number;
  friendOfCount?: number;
  avatar?: string;
  country?: string;
  city?: string;
  organization?: string;
  titlePhoto?: string;
};

type UserInfoResponse = {
  result: UserInfo[];
};

type RatingChange = {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
};

type RatingResponse = {
  result: RatingChange[];
};

export type CodeforcesStats = {
  handle: string;
  rating?: number | null;
  maxRating?: number | null;
  rank?: string | null;
  maxRank?: string | null;
  contribution?: number | null;
  friendOfCount?: number | null;
  avatarUrl?: string | null;
  country?: string | null;
  city?: string | null;
  organization?: string | null;
  lastContestName?: string | null;
  lastContestRank?: number | null;
  lastContestRating?: number | null;
  lastContestNewRating?: number | null;
  lastContestDate?: Date | null;
  fetchedAt: Date;
};

export async function fetchCodeforcesStatsFromApi(handle: string): Promise<CodeforcesStats | null> {
  try {
    const normalized = handle.trim();

    if (!normalized) {
      return null;
    }

    const userInfoUrl = `${CODEFORCES_API_ROOT}/user.info?handles=${encodeURIComponent(normalized)}`;
    const ratingUrl = `${CODEFORCES_API_ROOT}/user.rating?handle=${encodeURIComponent(normalized)}`;

    const [userInfoBody, ratingBody] = await Promise.allSettled([
      fetchJson<UserInfoResponse>(userInfoUrl),
      fetchJson<RatingResponse>(ratingUrl),
    ]);

    if (userInfoBody.status === "rejected") {
      throw userInfoBody.reason;
    }

    const user = userInfoBody.value.result[0];

    if (!user) {
      return null;
    }

    let lastContest: RatingChange | undefined;

    if (ratingBody.status === "fulfilled") {
      const history = ratingBody.value.result;
      if (history.length > 0) {
        lastContest = history[history.length - 1];
      }
    }

    return {
      handle: user.handle,
      rating: user.rating ?? null,
      maxRating: user.maxRating ?? null,
      rank: user.rank ?? null,
      maxRank: user.maxRank ?? null,
      contribution: user.contribution ?? null,
      friendOfCount: user.friendOfCount ?? null,
      avatarUrl: user.avatar ?? user.titlePhoto ?? null,
      country: user.country ?? null,
      city: user.city ?? null,
      organization: user.organization ?? null,
      lastContestName: lastContest?.contestName ?? null,
      lastContestRank: lastContest?.rank ?? null,
      lastContestRating: lastContest?.oldRating ?? null,
      lastContestNewRating: lastContest?.newRating ?? null,
      lastContestDate: lastContest
        ? new Date(lastContest.ratingUpdateTimeSeconds * SECONDS_TO_MS)
        : null,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("[codeforces] Failed to fetch stats", error);
    return null;
  }
}
