import { NextRequest, NextResponse } from "next/server";
import { authorizeOrderAccess } from "@/lib/domain/order-access";
import {
  DomainRuleError,
  submitPaymentProofTransactional,
} from "@/lib/domain/inventory-orders";
import { savePrivateUploadedFile, UploadValidationError } from "@/lib/domain/storage";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();
    const code = (formData.get("code") as string | null) ?? req.nextUrl.searchParams.get("code");
    const authz = await authorizeOrderAccess(id, code);
    if (!authz.allowed || !authz.order) {
      return NextResponse.json(
        { error: "No autorizado para subir comprobante a este pedido." },
        { status: authz.status }
      );
    }

    const idempotencyKey =
      (formData.get("idempotencyKey") as string | null)?.trim() ||
      `proof-${authz.order.id}-${Date.now()}`;
    const referenceNumber = (formData.get("referenceNumber") as string | null)?.trim() || null;
    const file = formData.get("file");

    let savedFile: { relativePath: string; mimeType: string; sizeBytes: number } | null = null;
    if (file && file instanceof File && file.size > 0) {
      const arrayBuf = await file.arrayBuffer();
      savedFile = await savePrivateUploadedFile("receipts", Buffer.from(arrayBuf));
    } else if (!referenceNumber) {
      return NextResponse.json(
        { error: "Adjunta un comprobante (imagen o PDF) o registra el número de referencia." },
        { status: 400 }
      );
    }

    const result = await submitPaymentProofTransactional({
      orderId: authz.order.id,
      idempotencyKey,
      method: authz.order.paymentMethod,
      proofFilePath: savedFile?.relativePath ?? null,
      proofMimeType: savedFile?.mimeType ?? null,
      proofSizeBytes: savedFile?.sizeBytes ?? null,
      referenceNumber,
      submittedByUserId: authz.user?.id ?? null,
    });

    return NextResponse.json(result, { status: result.deduplicated ? 200 : 201 });
  } catch (err) {
    if (err instanceof UploadValidationError || err instanceof DomainRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "No se pudo registrar el comprobante de pago." },
      { status: 500 }
    );
  }
}
