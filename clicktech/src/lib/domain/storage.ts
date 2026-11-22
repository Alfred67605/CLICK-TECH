import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export function getPrivateStorageRoot(): string {
  const configured = process.env.PRIVATE_STORAGE_DIR ?? "./storage/private";
  return path.resolve(process.cwd(), configured);
}

export type AllowedUploadFolder = "receipts" | "services";

interface DetectedFileType {
  mimeType: string;
  ext: string;
}

export function detectMagicFileType(buffer: Buffer): DetectedFileType | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: "image/png", ext: "png" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", ext: "jpg" };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", ext: "webp" };
  }

  // PDF: %PDF
  if (buffer.subarray(0, 4).toString("ascii") === "%PDF") {
    return { mimeType: "application/pdf", ext: "pdf" };
  }

  return null;
}

export class UploadValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function savePrivateUploadedFile(
  folder: AllowedUploadFolder,
  buffer: Buffer
): Promise<{
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
}> {
  if (buffer.length === 0) {
    throw new UploadValidationError("El archivo enviado está vacío.");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("El archivo supera el límite permitido de 5 MB.");
  }

  const detected = detectMagicFileType(buffer);
  if (!detected) {
    throw new UploadValidationError(
      "Formato de archivo no permitido. Solo se aceptan imágenes PNG, JPG, WEBP o documentos PDF válidos."
    );
  }

  const root = getPrivateStorageRoot();
  const targetDir = path.join(root, folder);
  await fs.mkdir(targetDir, { recursive: true });

  const fileName = `${Date.now()}-${crypto.randomUUID()}.${detected.ext}`;
  const fullPath = path.join(targetDir, fileName);
  await fs.writeFile(fullPath, buffer);

  return {
    relativePath: `${folder}/${fileName}`,
    mimeType: detected.mimeType,
    sizeBytes: buffer.length,
  };
}

export async function readPrivateFileSafe(relativePath: string): Promise<Buffer | null> {
  const root = getPrivateStorageRoot();
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep)) {
    return null;
  }
  try {
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}
