import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER || "",
      from: process.env.EMAIL_FROM || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/auth/register",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, user, token }) {
      // Add user ID to session
      if (session.user) {
        if (token) {
          session.user.id = token.sub || "";

          // Get user data for token-based auth
          const userData = await prisma.user.findUnique({
            where: { id: token.sub || "" },
            select: { username: true },
          });

          session.user.username = userData?.username || null;
        } else if (user) {
          session.user.id = user.id;
          session.user.username = user.username || null;
        }

        // Get user's memberships
        const memberships = await prisma.organizationMember.findMany({
          where: { userId: session.user.id },
          include: { organization: true },
        });

        // Add memberships to session
        session.memberships = memberships.map((membership) => ({
          id: membership.id,
          role: membership.role,
          organization: {
            id: membership.organization.id,
            name: membership.organization.name,
            type: membership.organization.type,
          },
        }));

        // Check if active organization is set in session
        if (!session.activeOrganizationId && memberships.length > 0) {
          session.activeOrganizationId = memberships[0].organizationId;
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Check if user has any organizations
      const userId = url.split("user=")[1]?.split("&")[0];

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            memberships: true,
          },
        });

        // If the user has no organizations, redirect to onboarding
        if (user && user.memberships.length === 0) {
          return `${baseUrl}/onboarding`;
        }
      }

      // Default redirect behavior
      if (url.startsWith(baseUrl)) {
        return url;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
