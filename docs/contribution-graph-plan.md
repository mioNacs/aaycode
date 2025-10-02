# Combined Contribution Graph Plan

## Objectives
- Provide a unified calendar-style heatmap summarizing coding activity across all connected services.
- Enable a single backend endpoint that aggregates daily contribution counts for the authenticated user.
- Ensure data freshness aligns with existing integration caching while allowing explicit re-syncs via the manual sync controls.

## Data Model
```ts
export type ContributionSample = {
  date: string; // ISO-8601 (YYYY-MM-DD)
  sources: {
    github?: number; // commits pushed on `date`
    leetcode?: number; // problems solved on `date`
    codeforces?: number; // submissions on `date`
    codechef?: number; // submissions on `date`
    geeksforgeeks?: number; // problems solved on `date`
  };
  total: number; // sum of source values (ignoring undefined)
};

export type ContributionSeries = {
  startDate: string; // inclusive
  endDate: string;   // inclusive
  samples: ContributionSample[];
};
```
- All aggregation will normalize timestamps to UTC dates to keep the heatmap consistent.
- The API will guarantee `samples` covers the full `[startDate, endDate]` range, filling missing dates with zeros.

## Data Sources & Fetching Strategy
| Platform | Current Capability | Needed Enhancement |
| --- | --- | --- |
| GitHub | No per-day data yet. Plan to scrape user contributions graph (`/users/{username}/contributions`) and count contributions per day. | New `fetchGitHubContributionsFromApi` returning `Array<{ date: string; count: number }>`
| LeetCode | No per-day breakdown. The public profile exposes a heatmap JSON via `https://leetcode-stats-api.herokuapp.com/{username}`? unreliable. Instead scrape GraphQL endpoint used by site to fetch calendar data. | Implement fetcher using `https://leetcode.com/graphql` with `userCalendar`. Needs CSRF token & cookie; fallback to `https://leetcode.com/graphql` with `operationName: langProblemsetQuestionCalendar`. Will require optional env for session token.
| Codeforces | API `user.status` returns submissions with timestamps. We already hit `https://codeforces.com/api/user.status`. Extend existing fetcher to capture `last 180 days` and bin by date. | Adjust Codeforces fetch to optionally return timeline data.
| CodeChef | Profile JSON includes contest counts per difficulty, not per day. Need to scrape `https://www.codechef.com/recent/user` or GraphQL? Might be heavy. Plan to limit to `fullySolvedHistory` if available; otherwise provide 0 contributions.
| GeeksforGeeks | Profile page contains `heatmapData.userData`. We can parse `__NEXT_DATA__` to extract `problemSolvedStats.calendar`. | Investigate `practice-calendar` API: `https://practiceapi.geeksforgeeks.org/api/practice-calendar?user_username=`.

### Iterative Implementation Order
1. **GitHub** (HTML contributions graph is accessible unauthenticated). Extend GitHub fetch module. ✅
2. **Codeforces** (API returns full submission history; just bin). May require pagination but manageable.
3. **GeeksforGeeks** (practice calendar endpoint). Validate per-day data.
4. **LeetCode** (GraphQL w/ session). Provide optional support; degrade gracefully when not available.
5. **CodeChef** (investigate; if no reliable per-day data, note as future work and return 0).

## Backend Aggregation API
- Route: `GET /api/contributions`
- Query params: `?start=YYYY-MM-DD&end=YYYY-MM-DD` (defaults: last 180 days). Validate range <= 365 days.
- Authenticated user only (session required).
- Steps:
  1. Identify connected services with usernames/handles.
  2. For each service, fetch per-day data via new cache helpers (`get{Service}ContributionSeriesForUser`). Each helper should reuse caching collections (new timeline collection or embed in existing stats doc). Cache key: date-range + user.
  3. Merge all series by date. When a service lacks data for a date, assume 0 contributions.
  4. Return `ContributionSeries` JSON.
- Error handling: if a service fetch fails, log and proceed with partial data; include `warnings` array in response.

## Storage & Caching
- Extend existing stats collections with optional `contributions` field storing the last fetched range plus daily counts. Example document addition:
```ts
{
  contributionSeries: {
    fetchedRange: { start: "2025-01-01", end: "2025-06-30" },
    samples: [ { date: "2025-06-01", count: 3 }, ... ],
    fetchedAt: ISODate()
  }
}
```
- Alternative: new collections per service (`github_contributions`, etc.) if bloating existing documents is a concern. For MVP, augment existing caches to avoid new collections.
- Respect manual sync: when `/sync` endpoint is hit, refresh both summary stats and contributions.

## Frontend Heatmap
- Library options:
  - [`@nivo/calendar`](https://nivo.rocks/calendar/) — rich calendar heatmap, SSR-friendly.
  - [`react-calendar-heatmap`](https://github.com/patientslikeme/react-calendar-heatmap)` — lightweight.
- Plan: choose `@nivo/calendar` for aesthetics and accessibility. Install via npm.
- New component: `src/components/profile/contribution-heatmap.tsx`
  - Props: `series: ContributionSeries`
  - Compute total range, feed into calendar.
  - Provide tooltip summarizing contributions per service.
- Data fetch: on `ProfilePage`, call new API via server component fetch (cache bust with revalidate). Alternatively, use client component with `useEffect`. Prefer server fetch for SSR.

## Phased Delivery
1. **Phase 1 (current iteration)**
  - Document data model (✅).
  - Implement GitHub contributions fetcher + caching. ✅
  - Add backend aggregation route returning GitHub data only (others stubbed with warnings). ✅
  - Integrate heatmap using GitHub data as proof of concept. ✅
2. **Phase 2**
   - Extend fetchers for Codeforces and GeeksforGeeks.
   - Update API aggregator to include new sources.
3. **Phase 3**
   - Investigate LeetCode and CodeChef data retrieval complexities.
   - Add fallback messaging when data is unavailable.

## Open Questions / Assumptions
- GitHub user contributions page accessible without auth? Works for public data; respects private contributions only if user toggled them public (beyond scope).
- Rate limits: GitHub contributions HTML is static; minimal risk. Codeforces API limit is 1 request per second; cache to respect.
- Timezones: Normalize all timestamps to UTC before binning.
- Performance: Response size for 365 samples × sources minimal (<50 KB). Adds at most a couple new network calls per sync.

## Next Steps
- Build `fetchGitHubContributionTimeline` in `src/lib/github/api.ts`.
- Store timeline via `upsertGitHubStatsForUser` or a dedicated helper.
- Add `GET /api/integrations/github/contributions` (internal) and aggregator route `GET /api/contributions`.
- Create frontend heatmap component displays aggregated totals.
