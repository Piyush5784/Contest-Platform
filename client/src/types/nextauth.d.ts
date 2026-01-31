import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      provider?: string;
      name?: string;
      email?: string;
      image?: string;
    };
  }

  interface User {
    provider?: string;
  }
}
