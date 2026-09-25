import { get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import {
  hasBlobCredentials,
  isServerlessReadonlyFs,
  blobPutOptions,
} from "@/lib/storage/assets";

/**
 * Read/write JSON documents.
 * Local: data/<name>.json under the project.
 * Vercel: Vercel Blob at data/<name>.json (persistent across deploys).
 */
export async function readJsonDocument<T>(
  name: string,
  fallback: T
): Promise<T> {
  const key = `data/${name}.json`;

  if (hasBlobCredentials() || isServerlessReadonlyFs()) {
    try {
      const opts = blobPutOptions();
      const result = await get(key, {
        access: "public",
        useCache: false,
        ...(opts.token ? { token: opts.token } : {}),
      });
      if (!result) return fallback;
      const text = await new Response(result.stream).text();
      if (!text.trim()) return fallback;
      return JSON.parse(text) as T;
    } catch (err) {
      console.warn(`Blob read ${key} failed, using fallback:`, err);
      return fallback;
    }
  }

  const file = path.join(process.cwd(), "data", `${name}.json`);
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonDocument<T>(
  name: string,
  value: T
): Promise<void> {
  const key = `data/${name}.json`;
  const body = JSON.stringify(value, null, 2);

  if (hasBlobCredentials() || isServerlessReadonlyFs()) {
    if (!hasBlobCredentials()) {
      throw new Error(
        "Cannot persist data on Vercel without Blob. Connect a Blob store or set BLOB_READ_WRITE_TOKEN."
      );
    }
    await put(key, body, {
      ...blobPutOptions(),
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }

  const file = path.join(process.cwd(), "data", `${name}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body, "utf8");
}
