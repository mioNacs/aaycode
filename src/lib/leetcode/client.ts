import { env } from "@/config";

export const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
export const LEETCODE_USER_AGENT = "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)";

type HeaderOverrides = Record<string, string | undefined>;

export const buildLeetCodeHeaders = (overrides: HeaderOverrides = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
    "User-Agent": LEETCODE_USER_AGENT,
  };

  const cookies: string[] = [];

  if (env.leetcode.session) {
    cookies.push(`LEETCODE_SESSION=${env.leetcode.session}`);
  }

  if (env.leetcode.csrfToken) {
    cookies.push(`csrftoken=${env.leetcode.csrfToken}`);
    headers["x-csrftoken"] = env.leetcode.csrfToken;
  }

  if (cookies.length > 0) {
    headers.Cookie = cookies.join("; ");
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 0) {
      headers[key] = value;
    }
  });

  return headers;
};
