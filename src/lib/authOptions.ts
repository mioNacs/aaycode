import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import clientPromise from "@/dbConfig/dbConfig";
import {
  ensureUserHasUsername,
  findUserByEmail,
  findUserById,
} from "./users";

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value || value.length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const optionalPort = (key: string, defaultValue: number): number => {
  const raw = process.env[key];

  if (!raw || raw.length === 0) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }

  return parsed;
};

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: requiredEnv("NEXTAUTH_SECRET"),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: requiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    }),
    GitHubProvider({
      clientId: requiredEnv("GITHUB_CLIENT_ID"),
      clientSecret: requiredEnv("GITHUB_CLIENT_SECRET"),
    }),
    EmailProvider({
      server: {
        host: requiredEnv("EMAIL_SERVER_HOST"),
        port: optionalPort("EMAIL_SERVER_PORT", 587),
        auth: {
          user: requiredEnv("EMAIL_SERVER_USER"),
          pass: requiredEnv("EMAIL_SERVER_PASSWORD"),
        },
      },
      from: requiredEnv("EMAIL_FROM"),
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ("username" in user) {
          token.username = (user as { username?: string | null }).username ?? null;
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
