import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  assertRateLimit,
  AuthError,
  clearSessionCookie,
  createUserSession,
  getCurrentUser,
  setSessionCookie,
  verifyPassword,
} from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(4, "Contraseña requerida"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    assertRateLimit(`login:${ip}`, 20, 60_000);

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    const { cookieValue, expiresAt } = await createUserSession(user.id, user.role, {
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
    });
    await setSessionCookie(cookieValue, expiresAt);

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "USER_LOGIN",
      entityType: "USER",
      entityId: user.id,
      ipAddress: ip,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error al iniciar sesión." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
