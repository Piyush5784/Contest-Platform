"use server";

import { getServerSession } from "next-auth";
import { AuthOptions } from "./app/lib/auth";
import prisma from "./app/lib/prisma";

export const checkUser = async () => {
  try {
    const session = await getServerSession(AuthOptions);

    if (!session || !session.user?.email) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email!,
      },
    });

    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
};

export const checkSession = async () => {
  try {
    const session = await getServerSession(AuthOptions);

    if (!session || !session.user?.email || !session.user.id) {
      return null;
    }

    return { id: session.user.id, email: session.user.email };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
};
