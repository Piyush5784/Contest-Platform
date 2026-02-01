import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { getErrorMessage, ReturnError } from "@/utils/format-response";

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
          throw new Error(
            JSON.stringify({
              error: "Email and password is required",
              success: false,
            }),
          );
        }

        try {
          const res = await axios.post(`${BACKEND_URL}/api/auth/verify`, {
            email: credentials.email,
            password: credentials.password,
          });
          const response = res.data;

          const userData = response.data;

          return {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.name,
            image: userData.image,
            role: userData.role,
            provider: "CREDENTIALS",
          };
        } catch (err: any) {
          const message = err?.response?.data?.error || "INVALID_CREDENTIALS";
          throw new Error(getErrorMessage(message));
        }
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
          throw new Error("Invalid Email");
        }
        try {
          const res = await axios.post(`${BACKEND_URL}/api/auth/google`, {
            email: user.email,
            name: user.name,
            image: user.image,
          });
          const userData = res.data.data;

          user.id = userData.id;
          user.role = userData.role;
          user.provider = "GOOGLE";

          return true;
        } catch (error) {
          throw new Error(ReturnError(error));
        }
      }
      return true;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.image = token.picture as string;
      session.user.provider = token.provider as string;
      session.user.name = token.name as string;
      session.user.role = token.role as string;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id.toString();
        token.email = user.email?.toString();
        token.picture = user.image?.toString();
        token.provider = user.provider?.toString();
        token.name = user.name?.toString();
        token.role = user.role;
      }
      return token;
    },
  },
};
