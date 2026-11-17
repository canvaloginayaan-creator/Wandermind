import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb, ensureReady, uid, nowIso } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "wm_session";
const SESSION_DAYS = 30;

export function hashPassword(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string) {
  try {
    return bcrypt.compareSync(pw, hash);
  } catch {
    return false;
  }
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  await ensureReady();
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?,?,?,?)"
  ).run(tokenHash(token), userId, expires.toISOString(), nowIso());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      getDb().prepare("DELETE FROM sessions WHERE token = ?").run(tokenHash(token));
    } catch {}
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  await ensureReady();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.home_city, u.currency, u.avatar_hue, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(tokenHash(token), nowIso()) as User | undefined;
  return row ?? null;
}

/**
 * For server components/actions that need a user. Sends an unauthenticated
 * visitor to /login instead of throwing, so expired sessions degrade into a
 * redirect rather than a 500 + error log.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function findUserByEmail(email: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email) as (User & { password_hash: string }) | undefined;
}

export function createUser(input: {
  email: string;
  name: string;
  password: string;
  home_city?: string;
  currency?: string;
}) {
  const db = getDb();
  const id = uid("usr");
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, home_city, currency, avatar_hue, created_at)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    id,
    input.email.trim().toLowerCase(),
    input.name.trim(),
    hashPassword(input.password),
    input.home_city || "Karachi",
    input.currency || "PKR",
    Math.floor(Math.random() * 360),
    nowIso()
  );
  return id;
}
