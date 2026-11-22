import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  assertRateLimit,
  AuthError,
  createUserSession,
  hashPassword,
  setSessionCookie,
} from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const registerSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre completo"),
  email: z.string().email("Correo inválido"),
  phone: z.string().min(5, "Teléfono requerido").optional().or(z.literal("")),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    assertRateLimit(`register:${ip}`, 10, 60_000);

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de registro inválidos" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta registrada con ese correo." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        phone: parsed.data.phone ? parsed.data.phone.trim() : null,
        passwordHash,
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
    });

    const { cookieValue, expiresAt } = await createUserSession(user.id, user.role, {
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
    });
    await setSessionCookie(cookieValue, expiresAt);

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo completar el registro." }, { status: 500 });
  }
}
