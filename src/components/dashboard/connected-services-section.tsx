import type { ReactNode } from "react";

import { ConnectGitHubButton } from "@/components/connect-github-button";
import type { UserConnections } from "@/lib/users";

import { ConnectLeetCodeButton } from "./connect-leetcode-button";
import { DisconnectGitHubButton } from "./disconnect-github-button";
import { DisconnectLeetCodeButton } from "./disconnect-leetcode-button";
import { ConnectCodeforcesButton } from "./connect-codeforces-button";
import { DisconnectCodeforcesButton } from "./disconnect-codeforces-button";
import { ConnectCodechefButton } from "./connect-codechef-button";
import { DisconnectCodechefButton } from "./disconnect-codechef-button";
import { ConnectGeeksforgeeksButton } from "./connect-geeksforgeeks-button";
import { DisconnectGeeksforgeeksButton } from "./disconnect-geeksforgeeks-button";
import { SyncIntegrationButton } from "./sync-integration-button";

type ConnectedServicesSectionProps = {
  connections?: UserConnections;
};

type ServiceRowProps = {
  title: string;
  description: string;
  action: ReactNode;
  helper?: ReactNode;
};

const formatLastSynced = (value?: Date | string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ServiceRow = ({ title, description, action, helper }: ServiceRowProps) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="mb-1 text-lg font-semibold text-[#0f172a]">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
        {helper ? <p className="mt-2 text-xs text-neutral-400">{helper}</p> : null}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">{action}</div>
  </div>
);

export function ConnectedServicesSection({ connections }: ConnectedServicesSectionProps) {
  const githubConnection = connections?.github;
  const githubLastSynced = githubConnection?.lastSyncedAt
    ? formatLastSynced(githubConnection.lastSyncedAt)
    : null;
  const githubStatus = githubConnection
    ? githubConnection.username
      ? `Connected as @${githubConnection.username}`
      : "Connected"
    : "Not connected";
  const githubHelper = githubConnection?.lastSyncedAt
    ? githubLastSynced
      ? `Last synced ${githubLastSynced}`
      : "Sync time unavailable."
    : "Link your GitHub account to import repositories, stars, and followers.";
  const leetCodeConnection = connections?.leetcode;
  const leetCodeLastSynced = leetCodeConnection?.lastSyncedAt
    ? formatLastSynced(leetCodeConnection.lastSyncedAt)
    : null;
  const codeforcesConnection = connections?.codeforces;
  const codeforcesLastSynced = codeforcesConnection?.lastSyncedAt
    ? formatLastSynced(codeforcesConnection.lastSyncedAt)
    : null;
  const codechefConnection = connections?.codechef;
  const codechefLastSynced = codechefConnection?.lastSyncedAt
    ? formatLastSynced(codechefConnection.lastSyncedAt)
    : null;
  const geeksforgeeksConnection = connections?.geeksforgeeks;
  const geeksforgeeksLastSynced = geeksforgeeksConnection?.lastSyncedAt
    ? formatLastSynced(geeksforgeeksConnection.lastSyncedAt)
    : null;

  return (
    <section className="card space-y-6 p-8">
      <header>
        <h2 className="text-xl font-semibold text-[#0f172a]">Connected Services</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Link developer platforms to enrich your public profile
        </p>
      </header>

      <div className="space-y-4">
        <ServiceRow
          title="GitHub"
          description={githubStatus}
          helper={githubHelper}
          action={
            githubConnection ? (
              <>
                <ConnectGitHubButton
                  connected
                  username={githubConnection.username}
                />
                <SyncIntegrationButton
                  endpoint="/api/integrations/github/sync"
                  serviceName="GitHub"
                />
                <DisconnectGitHubButton />
              </>
            ) : (
              <ConnectGitHubButton connected={false} />
            )
          }
        />

        <ServiceRow
          title="LeetCode"
          description={
            leetCodeConnection?.username
              ? `Connected as @${leetCodeConnection.username}`
              : "Not connected"
          }
          helper={
            leetCodeConnection?.lastSyncedAt
              ? leetCodeLastSynced
                ? `Last synced ${leetCodeLastSynced}`
                : "Sync time unavailable."
              : "Add your LeetCode username to showcase solved problems and contest rating."
          }
          action={
            leetCodeConnection ? (
              <>
                <ConnectLeetCodeButton username={leetCodeConnection.username} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/leetcode/sync"
                  serviceName="LeetCode"
                />
                <DisconnectLeetCodeButton />
              </>
            ) : (
              <ConnectLeetCodeButton username={null} />
            )
          }
        />

        <ServiceRow
          title="Codeforces"
          description={
            codeforcesConnection?.handle
              ? `Connected as @${codeforcesConnection.handle}`
              : "Not connected"
          }
          helper={
            codeforcesConnection?.lastSyncedAt
              ? codeforcesLastSynced
                ? `Last synced ${codeforcesLastSynced}`
                : "Sync time unavailable."
              : "Add your Codeforces handle to surface rating, rank, and recent contest placements."
          }
          action={
            codeforcesConnection ? (
              <>
                <ConnectCodeforcesButton handle={codeforcesConnection.handle} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/codeforces/sync"
                  serviceName="Codeforces"
                />
                <DisconnectCodeforcesButton />
              </>
            ) : (
              <ConnectCodeforcesButton handle={null} />
            )
          }
        />

        <ServiceRow
          title="CodeChef"
          description={
            codechefConnection?.username
              ? `Connected as @${codechefConnection.username}`
              : "Not connected"
          }
          helper={
            codechefConnection?.lastSyncedAt
              ? codechefLastSynced
                ? `Last synced ${codechefLastSynced}`
                : "Sync time unavailable."
              : "Link CodeChef to surface ratings, stars, and solved problems."
          }
          action={
            codechefConnection ? (
              <>
                <ConnectCodechefButton username={codechefConnection.username} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/codechef/sync"
                  serviceName="CodeChef"
                />
                <DisconnectCodechefButton />
              </>
            ) : (
              <ConnectCodechefButton username={null} />
            )
          }
        />

        <ServiceRow
          title="GeeksforGeeks"
          description={
            geeksforgeeksConnection?.username
              ? `Connected as @${geeksforgeeksConnection.username}`
              : "Not connected"
          }
          helper={
            geeksforgeeksConnection?.lastSyncedAt
              ? geeksforgeeksLastSynced
                ? `Last synced ${geeksforgeeksLastSynced}`
                : "Sync time unavailable."
              : "Connect GeeksforGeeks to showcase coding score, solved problems, and ranks."
          }
          action={
            geeksforgeeksConnection ? (
              <>
                <ConnectGeeksforgeeksButton username={geeksforgeeksConnection.username} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/geeksforgeeks/sync"
                  serviceName="GeeksforGeeks"
                />
                <DisconnectGeeksforgeeksButton />
              </>
            ) : (
              <ConnectGeeksforgeeksButton username={null} />
            )
          }
        />
      </div>
    </section>
  );
}
