import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const AuthOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "email", placeholder: "Enter your email" },
        password: { label: "password", placeholder: "Enter your password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password is required");
        }

        const checkUser = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!checkUser) {
          console.log("User not found");
          throw new Error("User not Found");
        }

        if (checkUser.provider !== "CREDENTIALS" || !checkUser.passwordHash) {
          console.log("Invalid Provider");
          throw new Error("Please login with Google");
        }

        const passCheck = await bcrypt.compare(
          credentials.password,
          checkUser.passwordHash!
        );

        if (!passCheck) {
          console.log("Invalid password");
          throw new Error("Invalid password");
        }

        return {
          id: checkUser.id.toString(),
          email: checkUser.email,
          name: checkUser.name,
          provider: "CREDENTIALS",
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google") {
        const email = user.email;

        if (!email) {
          throw new Error(
            JSON.stringify({ error: "Invalid email", status: false })
          );
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email,
              image: user.image as string,
              name: user.name as string,
              provider: "GOOGLE",
            },
          });
        }

        return true;
      }
      return true;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.image = token.picture as string;
      session.user.provider = token.provider as string;
      session.user.name = token.name as string;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id.toString();
        token.email = user.email?.toString();
        token.picture = user.image?.toString();
        token.provider = user.provider?.toString();
        token.name = user.name?.toString();
      }
      return token;
    },
  },
};
