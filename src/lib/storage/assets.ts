import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/** True when running on Vercel / Lambda (read-only app filesystem). */
export function isServerlessReadonlyFs(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.VERCEL_ENV
  );
}

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

/**
 * Persist a public asset.
 * - Local: writes under /public and returns a site-relative path.
 * - Vercel: uploads to Vercel Blob (requires BLOB_READ_WRITE_TOKEN) and returns the HTTPS URL.
 */
export async function savePublicAsset(
  relativePath: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const key = relativePath.replace(/^\/+/, "");
  const token = blobToken();
  const useBlob = Boolean(token) || isServerlessReadonlyFs();

  if (useBlob) {
    if (!token) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is required on Vercel to store images and PDFs. Add it in Vercel → Project → Storage → Blob, then Environment Variables."
      );
    }
    const blob = await put(key, data, {
      access: "public",
      contentType,
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }

  const abs = path.join(process.cwd(), "public", key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return `/${key}`;
}

/** Read asset bytes from a local public path or a remote (Blob) URL. */
export async function readPublicAsset(assetPath: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(assetPath)) {
    const res = await fetch(assetPath);
    if (!res.ok) {
      throw new Error(`Failed to fetch asset (${res.status})`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  const abs = path.join(
    process.cwd(),
    "public",
    assetPath.replace(/^\/+/, "")
  );
  return fs.readFile(abs);
}

export function isRemoteAsset(assetPath: string | undefined): boolean {
  return Boolean(assetPath && /^https?:\/\//i.test(assetPath));
}
