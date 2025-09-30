import { FiGithub } from "react-icons/fi";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";

type GitHubCardProps = {
  data: IntegrationPreview;
};

export function GitHubCard({ data }: GitHubCardProps) {
  return (
    <IntegrationCard
      icon={<FiGithub className="h-5 w-5" />}
      title="GitHub"
      description="Repositories, stars, followers"
      status={data.status}
      username={data.username}
      stats={data.stats}
      note={data.note}
      lastSyncedAt={data.lastSyncedAt}
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect GitHub",
        href:
          data.status === "connected" && data.username
            ? `https://github.com/${data.username}`
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.username),
      }}
    />
  );
}
