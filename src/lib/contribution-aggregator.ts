import type { UserWithId } from "./users";
import {
  ensureRangeOrder,
  mergeContributionSeries,
  toISODateString,
  type ContributionSeries,
  type MergeContributionInput,
} from "./contributions";
import { getGitHubContributionSeriesForUser } from "./github/contributions";
import { getLeetCodeContributionSeriesForUser } from "./leetcode/contributions";
import { getCodeforcesContributionSeriesForUser } from "./codeforces/contributions";
import { getCodechefContributionSeriesForUser } from "./codechef/contributions";
import { getGeeksforgeeksContributionSeriesForUser } from "./geeksforgeeks/contributions";

const MS_PER_DAY = 86_400_000;
const MAX_WINDOW_DAYS = 365;

const clampRange = (start: string, end: string): { start: string; end: string } => {
  const normalized = ensureRangeOrder(start, end);
  const startDate = new Date(`${normalized.start}T00:00:00Z`);
  const endDate = new Date(`${normalized.end}T00:00:00Z`);
  const windowSizeDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);

  if (windowSizeDays <= MAX_WINDOW_DAYS) {
    return normalized;
  }

  const clampedStart = new Date(endDate.getTime() - MAX_WINDOW_DAYS * MS_PER_DAY);
  return ensureRangeOrder(toISODateString(clampedStart), normalized.end);
};

const computeDefaultRange = (): { start: string; end: string } => {
  const today = new Date();
  const year = today.getUTCFullYear();
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));

  return ensureRangeOrder(toISODateString(startDate), toISODateString(endDate));
};

export type ContributionAggregationOptions = {
  start?: string;
  end?: string;
};

export type ContributionAggregationStats = {
  longestStreak: number;
  consistencyScore: number;
  activeDaysInWindow: number;
  windowDays: number;
};

export type ContributionAggregationResult = {
  series: ContributionSeries;
  warnings: string[];
  stats: ContributionAggregationStats;
};

const ACTIVITY_WINDOW_DAYS = 100;

const computeActivityStats = (series: ContributionSeries): ContributionAggregationStats => {
  const samples = series.samples;

  if (!samples.length) {
    return {
      longestStreak: 0,
      consistencyScore: 0,
      activeDaysInWindow: 0,
      windowDays: 0,
    };
  }

  const todayIso = toISODateString(new Date());
  const pastSamples = samples.filter((sample) => sample.date <= todayIso);

  if (!pastSamples.length) {
    return {
      longestStreak: 0,
      consistencyScore: 0,
      activeDaysInWindow: 0,
      windowDays: 0,
    };
  }

  let currentStreak = 0;
  let longestStreak = 0;

  pastSamples.forEach((sample) => {
    if (sample.total > 0) {
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });

  const windowDays = Math.min(pastSamples.length, ACTIVITY_WINDOW_DAYS);

  if (windowDays === 0) {
    return {
      longestStreak,
      consistencyScore: 0,
      activeDaysInWindow: 0,
      windowDays: 0,
    };
  }

  const startIndex = pastSamples.length - windowDays;
  let activeDaysInWindow = 0;

  for (let index = startIndex; index < pastSamples.length; index += 1) {
    if (pastSamples[index]?.total > 0) {
      activeDaysInWindow += 1;
    }
  }

  const consistencyScore = Math.round((activeDaysInWindow / windowDays) * 100);

  return {
    longestStreak,
    consistencyScore,
    activeDaysInWindow,
    windowDays,
  };
};

export const getContributionSeriesForUser = async (
  user: UserWithId,
  options: ContributionAggregationOptions = {}
): Promise<ContributionAggregationResult> => {
  const fallbackRange = computeDefaultRange();
  const requestedStart = options.start ?? fallbackRange.start;
  const requestedEnd = options.end ?? fallbackRange.end;
  const baseRange = ensureRangeOrder(requestedStart, requestedEnd);

  const targetRange = clampRange(baseRange.start, baseRange.end);
  const sources: MergeContributionInput = {};
  const warnings: string[] = [];

  const githubConnection = user.connections?.github;

  if (githubConnection?.username) {
    const githubSeries = await getGitHubContributionSeriesForUser(
      user._id.toString(),
      githubConnection.username,
      targetRange.start,
      targetRange.end
    );

    if (githubSeries) {
      if (githubSeries.samples.length === 0) {
        warnings.push("GitHub contributions returned no data for the requested range.");
      }
      sources.github = githubSeries;
    } else {
      warnings.push("GitHub contributions unavailable.");
    }
  } else {
    warnings.push("GitHub not connected.");
  }

  const leetCodeConnection = user.connections?.leetcode;

  if (leetCodeConnection?.username) {
    const leetCodeSeries = await getLeetCodeContributionSeriesForUser(
      user._id.toString(),
      leetCodeConnection.username,
      targetRange.start,
      targetRange.end
    );

    if (leetCodeSeries) {
      if (leetCodeSeries.samples.length === 0) {
        warnings.push("LeetCode contributions returned no data for the requested range.");
      }

      sources.leetcode = leetCodeSeries;
    } else {
      warnings.push("LeetCode contributions unavailable.");
    }
  } else {
    warnings.push("LeetCode not connected.");
  }

  const codechefConnection = user.connections?.codechef;

  if (codechefConnection?.username) {
    const codechefSeries = await getCodechefContributionSeriesForUser(
      user._id.toString(),
      codechefConnection.username,
      targetRange.start,
      targetRange.end
    );

    if (codechefSeries) {
      if (codechefSeries.samples.length === 0) {
        warnings.push("CodeChef contributions returned no data for the requested range.");
      }

      sources.codechef = codechefSeries;
    } else {
      warnings.push("CodeChef contributions unavailable.");
    }
  } else {
    warnings.push("CodeChef not connected.");
  }

  const codeforcesConnection = user.connections?.codeforces;

  if (codeforcesConnection?.handle) {
    const codeforcesSeries = await getCodeforcesContributionSeriesForUser(
      user._id.toString(),
      codeforcesConnection.handle,
      targetRange.start,
      targetRange.end
    );

    if (codeforcesSeries) {
      if (codeforcesSeries.samples.length === 0) {
        warnings.push("Codeforces contributions returned no data for the requested range.");
      }

      sources.codeforces = codeforcesSeries;
    } else {
      warnings.push("Codeforces contributions unavailable.");
    }
  } else {
    warnings.push("Codeforces not connected.");
  }

  const geeksforgeeksConnection = user.connections?.geeksforgeeks;

  if (geeksforgeeksConnection?.username) {
    const geeksforgeeksSeries = await getGeeksforgeeksContributionSeriesForUser(
      user._id.toString(),
      geeksforgeeksConnection.username,
      targetRange.start,
      targetRange.end
    );

    if (geeksforgeeksSeries) {
      if (geeksforgeeksSeries.samples.length === 0) {
        warnings.push("GeeksforGeeks contributions returned no data for the requested range.");
      }

      sources.geeksforgeeks = geeksforgeeksSeries;
    } else {
      warnings.push("GeeksforGeeks contributions unavailable.");
    }
  } else {
    warnings.push("GeeksforGeeks not connected.");
  }

  const aggregated = mergeContributionSeries(sources, targetRange.start, targetRange.end);

  const stats = computeActivityStats(aggregated);

  return {
    series: aggregated,
    warnings,
    stats,
  };
};
