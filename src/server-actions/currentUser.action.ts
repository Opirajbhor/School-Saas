"use server";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function currentUser() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export type sessionUserType = {
  email: string;
  emailVerified: boolean;
  name: string;
};
