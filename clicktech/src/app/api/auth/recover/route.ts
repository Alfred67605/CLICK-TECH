import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, AuthError, hashPassword, sha256 } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const requestSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    assertRateLimit(`recover:${ip}`, 10, 60_000);

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    const smtpAdapter = process.env.SMTP_ADAPTER ?? "local-dev-log";

    if (user && user.isActive) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(code),
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
          devPreviewCode: smtpAdapter === "local-dev-log" ? code : null,
        },
      });

      if (smtpAdapter === "local-dev-log") {
        console.log(`[ClickTech Auth Dev Adapter] Código de recuperación para ${email}: ${code}`);
        return NextResponse.json({
          ok: true,
          adapter: "local-dev-log",
          message:
            "Adaptador de correo externo no configurado (SMTP_ADAPTER=local-dev-log). En modo desarrollo local se generó un código temporal verificable.",
          devPreviewCode: code,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      adapter: smtpAdapter,
      message:
        smtpAdapter === "local-dev-log"
          ? "Si el correo existe, se registró la solicitud en el adaptador local de desarrollo."
          : "Si la cuenta existe, enviamos instrucciones a tu correo.",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error procesando recuperación." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const parsed = resetSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Código inválido o vencido." }, { status: 400 });
    }

    const tokenHash = sha256(parsed.data.code.trim().toUpperCase());
    const tokenRow = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!tokenRow) {
      return NextResponse.json({ error: "Código inválido o vencido." }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "USER_PASSWORD_RESET",
      entityType: "USER",
      entityId: user.id,
    });

    return NextResponse.json({ ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch {
    return NextResponse.json({ error: "Error actualizando contraseña." }, { status: 500 });
  }
}
