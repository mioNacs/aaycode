import { SiCodeforces } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";
import { PlatformHeatmap } from "./platform-heatmap";

type CodeforcesCardProps = {
  data: IntegrationPreview;
};

export function CodeforcesCard({ data }: CodeforcesCardProps) {
  const contributionSeries = data.contributionSeries;

  const detailContent = contributionSeries ? (
    <PlatformHeatmap platformName="Codeforces" series={contributionSeries} />
  ) : undefined;

  return (
    <IntegrationCard
      icon={<SiCodeforces className="h-5 w-5" />}
      title="Codeforces"
      description="Ratings, rankings, contest history"
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
            : "Connect Codeforces",
        href:
          data.status === "connected"
            ? data.profileUrl ?? (data.username ? `https://codeforces.com/profile/${data.username}` : "/dashboard")
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.profileUrl ?? data.username),
      }}
    />
  );
}
