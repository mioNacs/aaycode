const GFG_PROFILE_BASE_URL = "https://www.geeksforgeeks.org/user/";

const USER_AGENT = "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)";

const SCRIPT_REGEX =
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i;

const cleanString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  return undefined;
};

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const digits = value.replace(/[^0-9.-]+/g, "");
    if (!digits) {
      return undefined;
    }

    const numeric = Number.parseFloat(digits);
    return Number.isFinite(numeric) ? Math.round(numeric) : undefined;
  }

  return undefined;
};

export type GeeksforgeeksStats = {
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  codingScore?: number | null;
  totalProblemsSolved?: number | null;
  instituteRank?: number | null;
  schoolRank?: number | null;
  streak?: number | null;
  country?: string | null;
  fetchedAt: Date;
};

const extractNextData = (html: string): unknown => {
  const match = html.match(SCRIPT_REGEX);

  if (!match || !match[1]) {
    throw new Error("Unable to locate __NEXT_DATA__ script in GeeksforGeeks profile page");
  }

  return JSON.parse(match[1]) as unknown;
};

const isProfileMissing = (html: string): boolean => {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("profile not found") ||
    normalized.includes("user not found") ||
    normalized.includes("page you are looking for doesn't exist")
  );
};

const getNested = (source: unknown, keys: string[]): unknown => {
  return keys.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source ?? undefined);
};

export async function fetchGeeksforgeeksStatsFromApi(
  username: string
): Promise<GeeksforgeeksStats | null> {
  try {
    const normalized = username.trim();

    if (!normalized) {
      return null;
    }

    const profileUrl = `${GFG_PROFILE_BASE_URL}${encodeURIComponent(normalized)}/`;

    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }

      const body = await response.text();
      throw new Error(`GeeksforGeeks profile request failed (${response.status}): ${body}`);
    }

    const html = await response.text();

    if (!html || isProfileMissing(html)) {
      return null;
    }

    const nextData = extractNextData(html);

    const userInfo = getNested(nextData, ["props", "pageProps", "userInfo"]);

    if (!userInfo || typeof userInfo !== "object") {
      return null;
    }

    const userInfoRecord = userInfo as Record<string, unknown>;
    const avatarUrl = cleanString(userInfoRecord.profile_image_url);
    const codingScore = parseNumeric(userInfoRecord.score);
    const totalProblemsSolved = parseNumeric(userInfoRecord.total_problems_solved);
    const instituteRank = parseNumeric(userInfoRecord.institute_rank);
    const schoolRank = parseNumeric(userInfoRecord.school_rank);
    const streak = parseNumeric(userInfoRecord.pod_solved_longest_streak);
    const country = cleanString(userInfoRecord.country);

    return {
      username: normalized,
      profileUrl,
      avatarUrl: avatarUrl ?? null,
      codingScore: codingScore ?? null,
      totalProblemsSolved: totalProblemsSolved ?? null,
      instituteRank: instituteRank ?? null,
      schoolRank: schoolRank ?? null,
      streak: streak ?? null,
      country: country ?? null,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("[geeksforgeeks] Failed to fetch stats", error);
    return null;
  }
}
