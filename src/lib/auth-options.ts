import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { isDevelopmentLike, isMemoryMode } from "@/src/lib/demo-mode";
import type { SessionUser } from "@/src/lib/types";

const globalForAuthPrisma = globalThis as typeof globalThis & {
  authPrisma?: PrismaClient;
};

function getAuthPrisma() {
  if (!globalForAuthPrisma.authPrisma) {
    globalForAuthPrisma.authPrisma = new PrismaClient();
  }

  return globalForAuthPrisma.authPrisma;
}

function buildProviders() {
  const providers = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  if (!isMemoryMode() && process.env.EMAIL_FROM) {
    if (process.env.RESEND_API_KEY) {
      providers.push(
        Resend({
          apiKey: process.env.RESEND_API_KEY,
          from: process.env.EMAIL_FROM,
        }),
      );
    } else if (isDevelopmentLike()) {
      providers.push(
        Email({
          from: process.env.EMAIL_FROM,
          sendVerificationRequest: async ({ identifier, url }) => {
            console.warn(`[console-mailer] Magic link for ${identifier}: ${url}`);
          },
        }),
      );
    }
  }

  if (process.env.ENABLE_TEST_AUTH === "true" || isMemoryMode()) {
    providers.push(
      Credentials({
        name: "Demo sign-in",
        credentials: {
          email: { label: "Email", type: "email" },
          name: { label: "Name", type: "text" },
        },
        authorize: async (credentials) => {
          return {
            id: "demo-user",
            email: (credentials?.email as string) || "demo@aussiesfirsthome.local",
            name: (credentials?.name as string) || "Aussies First Home Demo User",
            tier: "free",
            subscriptionStatus: "inactive",
            demoMode: true,
          };
        },
      }),
    );
  }

  return providers;
}

export const authConfig: NextAuthConfig = {
  adapter: isMemoryMode() ? undefined : PrismaAdapter(getAuthPrisma()),
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier ?? "free";
        token.subscriptionStatus = (user as { subscriptionStatus?: string }).subscriptionStatus ?? "inactive";
        token.demoMode = (user as { demoMode?: boolean }).demoMode ?? isMemoryMode();
      }

      return token;
    },
    async session({ session, token }) {
      const enrichedUser = {
        id: String(token.id ?? "demo-user"),
        email: session.user?.email ?? null,
        name: session.user?.name ?? null,
        tier: (token.tier as SessionUser["tier"] | undefined) ?? "free",
        subscriptionStatus:
          (token.subscriptionStatus as SessionUser["subscriptionStatus"] | undefined) ?? "inactive",
        demoMode: Boolean(token.demoMode ?? isMemoryMode()),
      } satisfies SessionUser;

      return {
        ...session,
        user: enrichedUser,
      };
    },
  },
};
