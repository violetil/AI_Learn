import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

type AppRole = "TEACHER" | "STUDENT";
type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: AppRole;
};

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 天，持久化登录

function getJwtSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("缺少环境变量 SESSION_SECRET（生产环境必填）");
    }
    return new TextEncoder().encode(
      "dev-only-insecure-session-secret-min-32-chars!",
    );
  }
  if (raw.length < 32) {
    throw new Error("SESSION_SECRET 长度至少 32 字符");
  }
  return new TextEncoder().encode(raw);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function setSessionCookie(userId: string, email: string): Promise<void> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getJwtSecret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEC,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    const userId = payload.sub;
    if (typeof userId !== "string" || !userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
      },
    });
    if (!user) return null;
    return { ...user, role: user.role as AppRole };
  } catch {
    return null;
  }
}

export type RegisterResult =
  | { ok: true; user: { id: string; email: string; role: AppRole } }
  | { ok: false; error: "EMAIL_TAKEN" | "INVALID_INPUT" };

export async function registerUser(
  email: string,
  password: string,
  role: AppRole = "STUDENT",
): Promise<RegisterResult> {
  const norm = normalizeEmail(email);
  if (!isValidEmail(norm) || !isValidPassword(password) || (role !== "TEACHER" && role !== "STUDENT")) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: { email: norm, passwordHash, role },
    });
    return { ok: true, user: { id: user.id, email: user.email, role: user.role as AppRole } };
  } catch (e: unknown) {
    if (isPrismaUniqueViolation(e)) {
      return { ok: false, error: "EMAIL_TAKEN" };
    }
    throw e;
  }
}

export type LoginResult =
  | { ok: true; user: { id: string; email: string; role: AppRole } }
  | {
      ok: false;
      error: "USER_NOT_FOUND" | "INVALID_PASSWORD" | "INVALID_INPUT";
    };

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const norm = normalizeEmail(email);
  if (!isValidEmail(norm) || password.length === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const user = await prisma.user.findUnique({ where: { email: norm } });
  if (!user) {
    return { ok: false, error: "USER_NOT_FOUND" };
  }
  if (!user.passwordHash) {
    return { ok: false, error: "INVALID_PASSWORD" };
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return { ok: false, error: "INVALID_PASSWORD" };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role as AppRole },
  };
}
