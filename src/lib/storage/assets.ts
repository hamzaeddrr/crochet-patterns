import { get, put } from "@vercel/blob";
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

export function hasBlobCredentials(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID ||
      process.env.VERCEL_OIDC_TOKEN
  );
}

export function blobPutOptions(): Parameters<typeof put>[2] {
  const options: Parameters<typeof put>[2] = {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }
  return options;
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
    const blob = await put(key, data, {
      ...blobPutOptions(),
      contentType,
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
  const trimmed = assetPath.trim();
  if (!trimmed) {
    throw new Error("Empty asset path");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch asset (${res.status})`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) {
      throw new Error("Fetched asset was empty");
    }
    return buf;
  }

  const rel = trimmed.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  try {
    return await fs.readFile(abs);
  } catch {
    // Local miss but Blob creds present — try the same key on Blob
    if (hasBlobCredentials()) {
      const opts = blobPutOptions();
      const result = await get(rel, {
        access: "public",
        useCache: false,
        ...(opts.token ? { token: opts.token } : {}),
      });
      if (!result) {
        throw new Error(`Asset not found locally or on Blob: ${rel}`);
      }
      const buf = Buffer.from(
        await new Response(result.stream).arrayBuffer()
      );
      if (!buf.length) {
        throw new Error(`Blob asset empty: ${rel}`);
      }
      return buf;
    }
    throw new Error(`Asset not found: ${abs}`);
  }
}

export function isRemoteAsset(assetPath: string | undefined): boolean {
  return Boolean(assetPath && /^https?:\/\//i.test(assetPath));
}
