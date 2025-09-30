import { load} from "cheerio";
import type { Element } from "domhandler";

const CODECHEF_PROFILE_BASE_URL = "https://www.codechef.com/users/";

const USER_AGENT = "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)";

const cleanText = (value: string | undefined | null): string =>
  value ? value.replace(/\s+/g, " ").trim() : "";

const parseInteger = (value: string | undefined | null): number | undefined => {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return undefined;
  }

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return undefined;
  }

  const numeric = Number.parseFloat(match[0]);
  return Number.isFinite(numeric) ? Math.round(numeric) : undefined;
};

const parseRank = (value: string | undefined | null): number | undefined => {
  const cleaned = cleanText(value);

  if (!cleaned || /inactive/i.test(cleaned)) {
    return undefined;
  }

  const digits = cleaned.replace(/[^0-9]/g, "");

  if (!digits) {
    return undefined;
  }

  const rank = Number.parseInt(digits, 10);
  return Number.isFinite(rank) ? rank : undefined;
};

const buildStarsLabel = (starCount: number, divisionRaw: string | undefined): string | null => {
  const parts: string[] = [];

  if (starCount > 0) {
    parts.push(`${starCount}\u2605`);
  }

  const division = divisionRaw ? divisionRaw.replace(/[()]/g, "").trim() : "";

  if (division) {
    parts.push(division);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
};

export type CodechefStats = {
  username: string;
  profileUrl: string;
  rating?: number | null;
  highestRating?: number | null;
  stars?: string | null;
  globalRank?: number | null;
  countryRank?: number | null;
  fullySolved?: number | null;
  partiallySolved?: number | null;
  country?: string | null;
  fetchedAt: Date;
};

const isProfileMissing = (html: string): boolean => {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("user does not exist") ||
    normalized.includes("page not found") ||
    normalized.includes("profile not found")
  );
};

export async function fetchCodechefStatsFromApi(
  username: string
): Promise<CodechefStats | null> {
  try {
    const normalized = username.trim();

    if (!normalized) {
      return null;
    }

    const profileUrl = `${CODECHEF_PROFILE_BASE_URL}${encodeURIComponent(normalized)}`;
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
      throw new Error(`CodeChef profile request failed (${response.status}): ${body}`);
    }

    const html = await response.text();

    if (!html || isProfileMissing(html)) {
      return null;
    }

    const $ = load(html);

    const rating = parseInteger($(".rating-header .rating-number").first().text());

    let highestRating: number | undefined;
    $(".rating-header small").each((_index: number, element: Element) => {
      const text = $(element).text();
      if (/highest rating/i.test(text)) {
        highestRating = parseInteger(text);
        return false;
      }
      return undefined;
    });

    const starCount = $(".rating-header .rating-star span").length;

    let divisionRaw: string | undefined;
    $(".rating-header div").each((_index: number, element: Element) => {
      const text = $(element).text();
      if (text && text.toLowerCase().includes("div")) {
        divisionRaw = text;
        return false;
      }
      return undefined;
    });

    const globalRank = parseRank($(".rating-ranks li").first().find("strong").text());
    const countryRank = parseRank($(".rating-ranks li").eq(1).find("strong").text());

    let totalSolved: number | undefined;
    $(".rating-data-section.problems-solved h3").each(
      (_index: number, element: Element) => {
        const text = $(element).text();
        if (/total problems solved/i.test(text)) {
          totalSolved = parseInteger(text);
          return false;
        }
        return undefined;
      }
    );

    const country = cleanText($(".user-country-name").first().text()) || undefined;

    return {
      username: normalized,
      profileUrl,
      rating: rating ?? null,
      highestRating: highestRating ?? null,
      stars: buildStarsLabel(starCount, divisionRaw) ?? null,
      globalRank: globalRank ?? null,
      countryRank: countryRank ?? null,
      fullySolved: totalSolved ?? null,
      partiallySolved: null,
      country: country ?? null,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("[codechef] Failed to fetch stats", error);
    return null;
  }
}
