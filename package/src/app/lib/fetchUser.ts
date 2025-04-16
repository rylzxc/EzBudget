"use server"

import { prisma } from "@/database/src/client";

export async function getUser(userId: number) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("No user found");
    }

    return user;
  } catch (error) {
    console.error(error);
  }
}
