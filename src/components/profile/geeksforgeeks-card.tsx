import { SiGeeksforgeeks } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";
import { PlatformHeatmap } from "./platform-heatmap";

type GeeksforgeeksCardProps = {
  data: IntegrationPreview;
};

export function GeeksforgeeksCard({ data }: GeeksforgeeksCardProps) {
  const contributionSeries = data.contributionSeries;

  const detailContent = contributionSeries ? (
    <PlatformHeatmap platformName="GeeksforGeeks" series={contributionSeries} />
  ) : undefined;

  return (
    <IntegrationCard
      icon={<SiGeeksforgeeks className="h-5 w-5" />}
      title="GeeksforGeeks"
      description="Coding score, ranks, problem stats"
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
            : "Connect GeeksforGeeks",
        href:
          data.status === "connected"
            ? data.profileUrl ?? (data.username ? `https://www.geeksforgeeks.org/user/${data.username}/` : "/dashboard")
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.profileUrl ?? data.username),
      }}
    />
  );
}
