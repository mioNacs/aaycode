import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import clientPromise from "@/dbConfig/dbConfig";
import { env } from "@/config";
import {
  ensureUserHasUsername,
  findUserByEmail,
  findUserById,
  updateGitHubConnectionForUser,
} from "./users";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: env.nextAuth.secret,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: env.oauth.google.clientId,
      clientSecret: env.oauth.google.clientSecret,
    }),
    GitHubProvider({
      clientId: env.oauth.github.clientId,
      clientSecret: env.oauth.github.clientSecret,
    }),
    EmailProvider({
      server: {
        host: env.email.server.host,
        port: env.email.server.port,
        auth: {
          user: env.email.server.user,
          pass: env.email.server.password,
        },
      },
      from: env.email.from,
      maxAge: 10 * 60, // 10 minutes
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        const user = await findUserByEmail(email);

        if (!user || !user.hashedPassword) {
          throw new Error("No account found with that email.");
        }

        const isPasswordValid = await compare(password, user.hashedPassword);

        if (!isPasswordValid) {
          throw new Error("Incorrect password.");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          username:
            user.username ??
            (await ensureUserHasUsername(user._id.toString(), user.name, user.email)) ?? null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && user?.id) {
        try {
          const profileData = profile as Record<string, unknown> | null;
          const username =
            (profileData?.login as string | undefined) ?? account.providerAccountId;

          await updateGitHubConnectionForUser(user.id, {
            username,
            profileUrl: profileData?.html_url as string | undefined,
            avatarUrl: profileData?.avatar_url as string | undefined,
            publicRepos: profileData?.public_repos as number | undefined,
            followers: profileData?.followers as number | undefined,
            lastSyncedAt: new Date(),
          });
        } catch (error) {
          console.error("[next-auth] Failed to update GitHub connection", error);
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        const sessionUser = (session as { user?: Record<string, unknown>; username?: string }).user;
        const directUsername = (session as { username?: string | null }).username;

        if (sessionUser && "username" in sessionUser) {
          token.username = (sessionUser.username as string | null | undefined) ?? null;
        } else if (directUsername !== undefined) {
          token.username = directUsername ?? null;
        }

        if (sessionUser && "name" in sessionUser) {
          token.name = (sessionUser.name as string | null | undefined) ?? null;
        }

        if (sessionUser && "email" in sessionUser) {
          token.email = (sessionUser.email as string | null | undefined) ?? undefined;
        }

        if (sessionUser && "image" in sessionUser) {
          token.picture = (sessionUser.image as string | null | undefined) ?? undefined;
        }

        return token;
      }

      if (user) {
        token.id = user.id;

        if ("username" in user) {
          token.username = (user as { username?: string | null }).username ?? null;
        }

        if (typeof user.name === "string" || user.name === null) {
          token.name = user.name ?? null;
        }

        if (typeof user.email === "string") {
          token.email = user.email;
        }
      }

      if (!token.username && token.sub) {
        const dbUser = await findUserById(token.sub);

        if (dbUser) {
          const ensuredUsername =
            dbUser.username ??
            (await ensureUserHasUsername(dbUser._id.toString(), dbUser.name, dbUser.email));

          token.username = ensuredUsername ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (session.user) {
        session.user.username = (token.username as string | null | undefined) ?? null;

        if (token.name !== undefined) {
          session.user.name = (token.name as string | null | undefined) ?? null;
        }

        if (token.email !== undefined) {
          session.user.email = (token.email as string | undefined) ?? session.user.email;
        }
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await ensureUserHasUsername(user.id, user.name, user.email ?? undefined);
      } catch (error) {
        console.error("[next-auth] ensure username failed", error);
      }
    },
  },
};
