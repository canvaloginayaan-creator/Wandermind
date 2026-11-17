"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb, ensureReady } from "../db";
import {
  createSession,
  createUser,
  destroySession,
  findUserByEmail,
  requireUser,
  verifyPassword,
} from "../auth";

const registerSchema = z.object({
  name: z.string().min(2, "Tell me your name"),
  email: z.string().email("That email doesn't look right"),
  password: z.string().min(8, "At least 8 characters"),
  home_city: z.string().min(1),
  currency: z.string().min(1).default("PKR"),
});

export async function registerAction(_prev: any, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }
  await ensureReady();
  if (findUserByEmail(parsed.data.email)) {
    return { error: "An account with this email already exists. Try signing in." };
  }
  const id = createUser(parsed.data);
  await createSession(id);
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: any, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }
  await ensureReady();
  const user = findUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return { error: "Email or password is wrong." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function demoLoginAction(): Promise<void> {
  await ensureReady();
  const user = findUserByEmail("demo@wandermind.app");
  if (!user) redirect("/login");
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function updateProfileAction(_prev: any, formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const home_city = String(formData.get("home_city") ?? "").trim();
  const currency = String(formData.get("currency") ?? "PKR");
  if (name.length < 2) return { error: "Name is too short" };
  getDb()
    .prepare("UPDATE users SET name = ?, home_city = ?, currency = ? WHERE id = ?")
    .run(name, home_city || user.home_city, currency, user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile updated" };
}
