import { SiLeetcode } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";

type LeetCodeCardProps = {
  data: IntegrationPreview;
};

export function LeetCodeCard({ data }: LeetCodeCardProps) {
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
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect LeetCode",
        href:
          data.status === "connected" && data.username
            ? `https://leetcode.com/${data.username}`
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.username),
      }}
    />
  );
}
