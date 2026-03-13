import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getAuthPrisma } from "@/src/lib/auth-db";
import { isMemoryMode } from "@/src/lib/demo-mode";
import { normalizeProfileName, normalizeAuthEmail, verifyPassword } from "@/src/lib/password-auth";
import type { SessionUser } from "@/src/lib/types";

function buildProviders() {
  const providers = [];

  if (!isMemoryMode()) {
    providers.push(
      Credentials({
        id: "credentials",
        name: "Email and password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials) => {
          const email = normalizeAuthEmail(String(credentials?.email ?? ""));
          const password = String(credentials?.password ?? "");

          if (!email || !password) {
            return null;
          }

          const user = await getAuthPrisma().user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
            },
          });

          if (!user?.passwordHash) {
            return null;
          }

          const passwordIsValid = await verifyPassword(password, user.passwordHash);
          if (!passwordIsValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: "free",
            subscriptionStatus: "inactive",
            demoMode: false,
          };
        },
      }),
    );
  }

  if (process.env.ENABLE_TEST_AUTH === "true" || isMemoryMode()) {
    providers.push(
      Credentials({
        id: "demo-credentials",
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
        let resolvedName = normalizeProfileName(typeof user.name === "string" ? user.name : "");
        if (!resolvedName && !isMemoryMode() && typeof user.id === "string") {
          const existingUser = await getAuthPrisma().user.findUnique({
            where: { id: user.id },
            select: {
              name: true,
            },
          });
          resolvedName = normalizeProfileName(existingUser?.name ?? "");
        }

        token.id = user.id;
        token.name = resolvedName ?? token.name ?? null;
        token.tier = (user as { tier?: string }).tier ?? "free";
        token.subscriptionStatus = (user as { subscriptionStatus?: string }).subscriptionStatus ?? "inactive";
        token.demoMode = (user as { demoMode?: boolean }).demoMode ?? isMemoryMode();
      }

      return token;
    },
    async session({ session, token }) {
      let resolvedName = normalizeProfileName(typeof token.name === "string" ? token.name : session.user?.name ?? "");

      if (!resolvedName && !isMemoryMode() && typeof token.id === "string") {
        const existingUser = await getAuthPrisma().user.findUnique({
          where: { id: token.id },
          select: {
            name: true,
          },
        });
        resolvedName = normalizeProfileName(existingUser?.name ?? "");
      }

      const enrichedUser = {
        id: String(token.id ?? "demo-user"),
        email: session.user?.email ?? null,
        name: resolvedName ?? null,
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
