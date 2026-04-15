/**
 * JWT 签发与校验（与 lib/auth 中会话 Cookie 使用同一密钥与算法）。
 * 供 Cookie 会话与 API Bearer 鉴权共用。
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

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

export type AccessTokenPayload = JWTPayload & {
  sub?: string;
  email?: string;
};

export async function signAccessToken(input: {
  userId: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ email: input.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export { SESSION_MAX_AGE_SEC };
