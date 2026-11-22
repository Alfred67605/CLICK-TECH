import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "clicktech_session";
const CART_COOKIE_NAME = "clicktech_cart_sid";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET environment variable is missing or too short.");
  }
  return new TextEncoder().encode(secret);
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  mustChangePassword: boolean;
  sessionId: string;
}

export async function createUserSession(
  userId: string,
  role: Role,
  meta?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<{ cookieValue: string; expiresAt: Date }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const session = await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    },
  });

  const jwt = await new SignJWT({ sid: session.id, tok: rawToken, uid: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());

  return { cookieValue: jwt, expiresAt };
}

export async function setSessionCookie(cookieValue: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      if (typeof payload.sid === "string") {
        await prisma.session.deleteMany({ where: { id: payload.sid } });
      }
    } catch {
      // Ignore malformed token on logout
    }
  }
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserFromCookieValue(
  cookieValue: string | undefined
): Promise<SessionUser | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, getSecretKey());
    if (
      typeof payload.sid !== "string" ||
      typeof payload.tok !== "string" ||
      typeof payload.uid !== "string"
    ) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            mustChangePassword: true,
          },
        },
      },
    });

    if (
      !session ||
      session.tokenHash !== sha256(payload.tok) ||
      session.expiresAt < new Date() ||
      !session.user.isActive
    ) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      phone: session.user.phone,
      role: session.user.role,
      mustChangePassword: session.user.mustChangePassword,
      sessionId: session.id,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const cookieValue = store.get(SESSION_COOKIE_NAME)?.value;
  return getSessionUserFromCookieValue(cookieValue);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Debes iniciar sesión para realizar esta acción.", 401);
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("No cuentas con permisos suficientes para esta operación.", 403);
  }
  return user;
}

export async function getOrCreateCartSessionToken(): Promise<string> {
  const store = await cookies();
  let sid = store.get(CART_COOKIE_NAME)?.value;
  if (!sid) {
    sid = crypto.randomBytes(24).toString("hex");
    store.set(CART_COOKIE_NAME, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return sid;
}

export async function getExistingCartSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE_NAME)?.value ?? null;
}

// Simple fixed-window in-memory rate limiter for auth & public form endpoints
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function assertRateLimit(
  key: string,
  maxAttempts = 15,
  windowMs = 60_000
): void {
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || entry.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > maxAttempts) {
    throw new AuthError(
      "Demasiados intentos en poco tiempo. Espera un minuto antes de volver a intentarlo.",
      429
    );
  }
}
