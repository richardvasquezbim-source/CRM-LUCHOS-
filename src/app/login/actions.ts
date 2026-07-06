"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, hashAppPassword } from "@/lib/auth";

export type LoginFormState = { error?: string };

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const password = String(formData.get("password") ?? "");

  if (!password || password !== process.env.APP_PASSWORD) {
    return { error: "Contraseña incorrecta" };
  }

  (await cookies()).set(AUTH_COOKIE, hashAppPassword(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect("/");
}
