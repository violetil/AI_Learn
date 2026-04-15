import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { SESSION_MAX_AGE_SEC, signAccessToken, verifyAccessToken } from "@/lib/jwt";
import type { AppRole, SessionUser } from "@/types/auth";

export type { SessionUser, AppRole } from "@/types/auth";

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

const SESSION_COOKIE = "session";

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
  const token = await signAccessToken({ userId, email });

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

async function loadUserById(userId: string): Promise<SessionUser | null> {
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
}

/**
 * 从 JWT 字符串解析当前用户（供 Cookie 与 Bearer 共用）。
 */
export async function getSessionUserFromToken(
  token: string,
): Promise<SessionUser | null> {
  const payload = await verifyAccessToken(token);
  const userId = payload?.sub;
  if (typeof userId !== "string" || !userId) return null;
  return loadUserById(userId);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUserFromToken(token);
}

/**
 * Route Handler / 外部客户端：支持 Cookie 会话 或 `Authorization: Bearer <jwt>`。
 */
export async function getSessionUserFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const raw = auth.slice(7).trim();
    if (raw) {
      const user = await getSessionUserFromToken(raw);
      if (user) return user;
    }
  }
  return getSessionUser();
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
