import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username?: string | null;
    };
  }

  interface User {
    id: string;
    username?: string | null;
  }

  interface Account {
    access_token?: string | null;
    token_type?: string | null;
    scope?: string | null;
    refresh_token?: string | null;
    expires_at?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string | null;
  }
}
