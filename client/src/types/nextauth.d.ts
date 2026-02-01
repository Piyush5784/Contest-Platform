import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      provider?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
    };
  }

  interface User {
    provider?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    provider?: string;
    role?: string;
  }
}
