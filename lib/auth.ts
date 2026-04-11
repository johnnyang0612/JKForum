import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("請輸入信箱與密碼");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            hashedPassword: true,
            username: true,
            displayName: true,
            role: true,
            status: true,
            profile: {
              select: { avatarUrl: true },
            },
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("帳號或密碼錯誤");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("帳號或密碼錯誤");
        }

        if (user.status === "BANNED") {
          throw new Error("此帳號已被封鎖，請聯繫管理員");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("此帳號已被暫停使用");
        }

        // 更新最後登入時間
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.profile?.avatarUrl || null,
          role: user.role,
          username: user.username,
          status: user.status,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // LINE Login
    {
      id: "line",
      name: "LINE",
      type: "oauth",
      authorization: {
        url: "https://access.line.me/oauth2/v2.1/authorize",
        params: { scope: "profile openid email" },
      },
      token: "https://api.line.me/oauth2/v2.1/token",
      userinfo: "https://api.line.me/v2/profile",
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
      profile(profile: Record<string, string>) {
        return {
          id: profile.userId,
          name: profile.displayName,
          email: "",
          image: profile.pictureUrl,
          role: "USER" as const,
          username: profile.displayName || `line_${profile.userId.slice(0, 8)}`,
          status: "ACTIVE" as const,
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        const u = user as { role?: string; username?: string; status?: string };
        token.role = (u.role || "USER") as UserRole;
        token.username = (u.username || "") as string;
        token.status = (u.status || "ACTIVE") as UserStatus;
      }

      // 支援 session update
      if (trigger === "update" && session) {
        if (session.username) token.username = session.username;
        if (session.role) token.role = session.role;
        if (session.status) token.status = session.status;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {
        // 第三方登入首次建立用戶時可能還沒有完整記錄
      });
    },
  },
};
