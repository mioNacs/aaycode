import { SiCodeforces } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";

type CodeforcesCardProps = {
  data: IntegrationPreview;
};

export function CodeforcesCard({ data }: CodeforcesCardProps) {
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
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect Codeforces",
        href:
          data.status === "connected" && data.username
            ? `https://codeforces.com/profile/${data.username}`
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.username),
      }}
    />
  );
}
