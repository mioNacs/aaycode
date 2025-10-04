import { SiCodechef } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";
import { PlatformHeatmap } from "./platform-heatmap";

type CodechefCardProps = {
  data: IntegrationPreview;
};

export function CodechefCard({ data }: CodechefCardProps) {
  const contributionSeries = data.contributionSeries;

  const detailContent = contributionSeries ? (
    <PlatformHeatmap platformName="CodeChef" series={contributionSeries} />
  ) : undefined;

  return (
    <IntegrationCard
      icon={<SiCodechef className="h-5 w-5" />}
      title="CodeChef"
      description="Ratings, stars, solved problems"
      status={data.status}
      username={data.username}
      stats={data.stats}
      note={data.note}
      lastSyncedAt={data.lastSyncedAt}
      profileUrl={data.profileUrl}
      insights={data.insights}
      detailContent={detailContent}
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect CodeChef",
        href:
          data.status === "connected"
            ? data.profileUrl ?? (data.username ? `https://www.codechef.com/users/${data.username}` : "/dashboard")
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.profileUrl ?? data.username),
      }}
    />
  );
}
