import { SiLeetcode } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";
import { PlatformHeatmap } from "./platform-heatmap";

type LeetCodeCardProps = {
  data: IntegrationPreview;
};

export function LeetCodeCard({ data }: LeetCodeCardProps) {
  const contributionSeries = data.contributionSeries;

  const detailContent = contributionSeries ? (
    <PlatformHeatmap platformName="LeetCode" series={contributionSeries} />
  ) : undefined;

  return (
    <IntegrationCard
      icon={<SiLeetcode className="h-5 w-5" />}
      title="LeetCode"
      description="Solved problems, contests, badges"
      status={data.status}
      username={data.username}
      stats={data.stats}
      note={data.note}
      lastSyncedAt={data.lastSyncedAt}
      avatarUrl={data.avatarUrl}
      profileUrl={data.profileUrl}
      insights={data.insights}
      detailContent={detailContent}
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect LeetCode",
        href:
          data.status === "connected"
            ? data.profileUrl ?? (data.username ? `https://leetcode.com/${data.username}` : "/dashboard")
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.profileUrl ?? data.username),
      }}
    />
  );
}
