export const GFG_PROFILE_BASE_URL = "https://www.geeksforgeeks.org/user/";
export const GFG_API_SUBMISSIONS_URL = "https://practiceapi.geeksforgeeks.org/api/v1/user/profile/submissions/";

export const USER_AGENT = "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)";

const INITIAL_STATE_REGEX = /window\.__INITIAL_STATE__\s*=\s*({.*?});/;
// Fallback for older pages or alternative structures
const NEXT_DATA_REGEX = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i;

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

export const extractNextData = (html: string): unknown => {
  // New method: Try parsing window.__INITIAL_STATE__
  const stateMatch = html.match(INITIAL_STATE_REGEX);
  if (stateMatch && stateMatch[1]) {
    try {
      return JSON.parse(stateMatch[1]);
    } catch (e) {
      console.warn("[geeksforgeeks] Failed to parse __INITIAL_STATE__", e);
    }
  }

  // Fallback: Try __NEXT_DATA__
  const nextDataMatch = html.match(NEXT_DATA_REGEX);
  if (nextDataMatch && nextDataMatch[1]) {
    try {
      return JSON.parse(nextDataMatch[1]);
    } catch (e) {
      console.warn("[geeksforgeeks] Failed to parse __NEXT_DATA__", e);
    }
  }
  
  // Return empty object if extraction fails, caller should handle it
  return {};
};

export const isProfileMissing = (html: string): boolean => {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("profile not found") ||
    normalized.includes("user not found") ||
    normalized.includes("page you are looking for doesn't exist")
  );
};

export const getNested = (source: unknown, keys: string[]): unknown => {
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

    const state = extractNextData(html);
    
    // Try to find user data in possible locations in the state object
    // __INITIAL_STATE__ usually has userInfo or profileData
    // __NEXT_DATA__ usually has props.pageProps.userInfo
    
    let userInfo = getNested(state, ["userInfo"]);
    if (!userInfo) userInfo = getNested(state, ["profileData"]);
    if (!userInfo) userInfo = getNested(state, ["props", "pageProps", "userInfo"]);

    // If still not found, try falling back to API
    if (!userInfo || typeof userInfo !== "object") {
       console.warn(`[geeksforgeeks] JSON extraction failed for ${normalized}. Attempting API fallback...`);
       try {
         const apiRes = await fetch(`${GFG_API_SUBMISSIONS_URL}${encodeURIComponent(normalized)}/`, {
            headers: { "User-Agent": USER_AGENT },
            next: { revalidate: 60 * 60 }
         });
         
         if (apiRes.ok) {
            const apiData = await apiRes.json();
             // API usually returns { info: { ... }, result: [ ...missions ] } or similar
             // We map what we can. The API might not contain all profile details.
             const info = apiData.info || {};
             
             return {
                username: normalized,
                profileUrl,
                avatarUrl: cleanString(info.profile_image_url) ?? null,
                codingScore: parseNumeric(info.score) ?? null,
                totalProblemsSolved: parseNumeric(info.total_problems_solved) ?? null,
                instituteRank: parseNumeric(info.institute_rank) ?? null,
                schoolRank: parseNumeric(info.school_rank) ?? null,
                streak: parseNumeric(info.pod_solved_longest_streak) ?? null,
                country: cleanString(info.country) ?? null,
                fetchedAt: new Date(),
             };
         }
       } catch (apiErr) {
          console.error("[geeksforgeeks] API fallback failed", apiErr);
       }
    }

    if (!userInfo || typeof userInfo !== "object") {
      // Final fallback: Regex/Selectors on the HTML if JSON failed
      // Implementing basic regex scraping for critical stats as last resort
      const scoreMatch = html.match(/codingScore\s*=\s*['"]?(\d+)['"]?/i) || html.match(/class="scoreCard_score__[^"]+">(\d+)</);
      const problemsMatch = html.match(/totalProblemsSolved\s*=\s*['"]?(\d+)['"]?/i) || html.match(/class="scoreCard_problems__[^"]+">(\d+)</);
      
      if (scoreMatch || problemsMatch) {
         return {
            username: normalized,
            profileUrl,
            avatarUrl: null,
            codingScore: scoreMatch ? parseNumeric(scoreMatch[1]) : null,
            totalProblemsSolved: problemsMatch ? parseNumeric(problemsMatch[1]) : null,
            instituteRank: null,
            schoolRank: null,
            streak: null,
            country: null,
            fetchedAt: new Date(),
         };
      }
    
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
