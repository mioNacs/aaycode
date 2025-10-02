import { env } from "@/config";
import { load } from "cheerio";

const GITHUB_API_ROOT = "https://api.github.com";

const createAuthHeaders = () => {
  const credentials = Buffer.from(
    `${env.oauth.github.clientId}:${env.oauth.github.clientSecret}`
  ).toString("base64");

  return {
    Authorization: `Basic ${credentials}`,
    "User-Agent": "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)",
    Accept: "application/vnd.github+json",
  } satisfies HeadersInit;
};

type GitHubUserResponse = {
  login: string;
  followers: number;
  public_repos: number;
  html_url: string;
  avatar_url: string;
};

type GitHubRepoResponse = {
  name: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  private: boolean;
};

export type GitHubLanguageStat = {
  name: string;
  count: number;
  stars: number;
  percentage: number;
};

export type GitHubStats = {
  username: string;
  profileUrl: string;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  repoCount: number;
  totalStars: number;
  topLanguages: GitHubLanguageStat[];
  fetchedAt: Date;
};

export type GitHubContributionDay = {
  date: string;
  count: number;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: createAuthHeaders(),
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw Object.assign(new Error("GitHub user not found"), { status: 404 });
    }

    const errorBody = await response.text();
    throw new Error(
      `GitHub API request failed (${response.status}): ${errorBody}`
    );
  }

  return (await response.json()) as T;
};

const computeLanguageStats = (repos: GitHubRepoResponse[]): GitHubLanguageStat[] => {
  const languageMap = new Map<string, { count: number; stars: number }>();

  repos.forEach((repo) => {
    if (repo.fork || repo.private) {
      return;
    }

    const language = repo.language ?? "Other";
    const entry = languageMap.get(language) ?? { count: 0, stars: 0 };

    entry.count += 1;
    entry.stars += repo.stargazers_count ?? 0;

    languageMap.set(language, entry);
  });

  const totalCount = Array.from(languageMap.values()).reduce(
    (sum, value) => sum + value.count,
    0
  );

  if (totalCount === 0) {
    return [];
  }

  return Array.from(languageMap.entries())
    .sort((a, b) => {
      if (b[1].count === a[1].count) {
        return b[1].stars - a[1].stars;
      }

      return b[1].count - a[1].count;
    })
    .slice(0, 3)
    .map(([name, value]) => ({
      name,
      count: value.count,
      stars: value.stars,
      percentage: Math.round((value.count / totalCount) * 100),
    }));
};

export async function fetchGitHubStatsFromApi(
  username: string
): Promise<GitHubStats | null> {
  try {
    const normalizedUsername = username.trim();
    const userUrl = `${GITHUB_API_ROOT}/users/${encodeURIComponent(
      normalizedUsername
    )}`;
    const reposUrl = `${userUrl}/repos?per_page=100&sort=updated`;

    const [user, repos] = await Promise.all([
      fetchJson<GitHubUserResponse>(userUrl),
      fetchJson<GitHubRepoResponse[]>(reposUrl),
    ]);

    const visibleRepos = repos.filter((repo) => !repo.fork && !repo.private);
    const totalStars = visibleRepos.reduce(
      (sum, repo) => sum + (repo.stargazers_count ?? 0),
      0
    );

    const topLanguages = computeLanguageStats(visibleRepos);

    return {
      username: user.login,
      profileUrl: user.html_url,
      avatarUrl: user.avatar_url,
      followers: user.followers,
      publicRepos: user.public_repos,
      repoCount: visibleRepos.length,
      totalStars,
      topLanguages,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      return null;
    }

    console.error("[github] Failed to fetch stats", error);
    return null;
  }
}

type ContributionRangeOptions = {
  start?: string;
  end?: string;
};

const parseContributionHtml = (html: string): GitHubContributionDay[] => {
  const $ = load(html);
  const samples: GitHubContributionDay[] = [];

  $("svg g rect[data-date]").each((_, element) => {
    const date = $(element).attr("data-date");
    const rawCount = $(element).attr("data-count");

    if (!date || !rawCount) {
      return;
    }

    const count = Number.parseInt(rawCount, 10);

    if (Number.isNaN(count)) {
      return;
    }

    samples.push({
      date,
      count,
    });
  });

  return samples;
};

export async function fetchGitHubContributionTimelineFromApi(
  username: string,
  options: ContributionRangeOptions = {}
): Promise<GitHubContributionDay[] | null> {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return null;
  }

  const params = new URLSearchParams();
  if (options.start) {
    params.set("from", options.start);
  }
  if (options.end) {
    params.set("to", options.end);
  }

  const query = params.toString();
  const contributionsUrl = `${GITHUB_API_ROOT.replace("api.", "")}/users/${encodeURIComponent(
    normalizedUsername
  )}/contributions${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(contributionsUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }

      const errorBody = await response.text();
      throw new Error(
        `GitHub contributions request failed (${response.status}): ${errorBody.slice(0, 200)}`
      );
    }

    const html = await response.text();
    return parseContributionHtml(html);
  } catch (error) {
    console.error("[github] Failed to fetch contributions", error);
    return null;
  }
}
