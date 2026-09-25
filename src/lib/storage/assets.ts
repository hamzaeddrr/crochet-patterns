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

function hasBlobCredentials(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID ||
      process.env.VERCEL_OIDC_TOKEN
  );
}

/**
 * Persist a public asset.
 * - Local (no Blob creds): writes under /public and returns a site-relative path.
 * - Vercel / with Blob: uploads via @vercel/blob (OIDC or BLOB_READ_WRITE_TOKEN).
 */
export async function savePublicAsset(
  relativePath: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const key = relativePath.replace(/^\/+/, "");
  const useBlob = hasBlobCredentials() || isServerlessReadonlyFs();

  if (useBlob) {
    if (!hasBlobCredentials() && isServerlessReadonlyFs()) {
      throw new Error(
        "No Vercel Blob credentials. Connect a Blob store to this project (Storage → Blob), or set BLOB_READ_WRITE_TOKEN, then redeploy."
      );
    }
    const options: Parameters<typeof put>[2] = {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    };
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      options.token = process.env.BLOB_READ_WRITE_TOKEN;
    }
    const blob = await put(key, data, options);
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
