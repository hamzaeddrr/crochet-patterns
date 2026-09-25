import { promises as fs } from "fs";
import path from "path";

export type FlareQuality =
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "auto";

export interface AdminSettings {
  openaiApiKey?: string;
  contentModel: string;
  imageModel: string;
  imageQuality: string;
  imageSize: string;
  siteUrl?: string;
  defaultCurrency: string;
  defaultPriceCents: number;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripePublishableKey?: string;
  adminPassword?: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "admin-settings.json");

export function defaultAdminSettings(): AdminSettings {
  return {
    contentModel: process.env.OPENAI_CONTENT_MODEL || "gpt-5-mini",
    imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
    imageQuality: process.env.OPENAI_IMAGE_QUALITY || "high",
    imageSize: process.env.OPENAI_IMAGE_SIZE || "auto",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
    defaultCurrency: process.env.DEFAULT_CURRENCY || "usd",
    defaultPriceCents: Number(process.env.DEFAULT_PRICE_CENTS || 499),
  };
}

async function ensure(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(FILE);
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(defaultAdminSettings(), null, 2));
    } catch (err) {
      // Read-only/ephemeral FS (e.g. some serverless) — skip persist
      console.warn("admin-settings.json not writable:", err);
    }
  }
}

export async function readAdminSettings(): Promise<AdminSettings> {
  await ensure();
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as AdminSettings;
    return { ...defaultAdminSettings(), ...raw };
  } catch {
    return defaultAdminSettings();
  }
}

export async function saveAdminSettings(
  patch: Partial<AdminSettings>
): Promise<AdminSettings> {
  const current = await readAdminSettings();
  const next: AdminSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  // Don't wipe secrets if empty string sent for "leave unchanged"
  if (patch.openaiApiKey === "") delete next.openaiApiKey;
  if (patch.stripeSecretKey === "") delete next.stripeSecretKey;
  if (patch.stripeWebhookSecret === "") delete next.stripeWebhookSecret;
  if (patch.adminPassword === "") delete next.adminPassword;
  if (patch.openaiApiKey === undefined && current.openaiApiKey) {
    next.openaiApiKey = current.openaiApiKey;
  }
  if (patch.stripeSecretKey === undefined && current.stripeSecretKey) {
    next.stripeSecretKey = current.stripeSecretKey;
  }
  if (patch.stripeWebhookSecret === undefined && current.stripeWebhookSecret) {
    next.stripeWebhookSecret = current.stripeWebhookSecret;
  }
  if (patch.adminPassword === undefined && current.adminPassword) {
    next.adminPassword = current.adminPassword;
  }
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function publicAdminSettings(s: AdminSettings) {
  return {
    contentModel: s.contentModel,
    imageModel: s.imageModel,
    imageQuality: s.imageQuality,
    imageSize: s.imageSize,
    siteUrl: s.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
    defaultCurrency: s.defaultCurrency,
    defaultPriceCents: s.defaultPriceCents,
    stripePublishableKey:
      s.stripePublishableKey ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "",
    hasOpenaiApiKey: Boolean(s.openaiApiKey || process.env.OPENAI_API_KEY),
    hasStripeSecretKey: Boolean(
      s.stripeSecretKey || process.env.STRIPE_SECRET_KEY
    ),
    hasStripeWebhookSecret: Boolean(
      s.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
    ),
    hasAdminPasswordOverride: Boolean(s.adminPassword),
    updatedAt: s.updatedAt,
  };
}

export async function resolveOpenAiApiKey(): Promise<string> {
  const s = await readAdminSettings();
  const key = s.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

export async function resolveContentModel(): Promise<string> {
  const s = await readAdminSettings();
  return s.contentModel || "gpt-5-mini";
}

export async function resolveImageModel(): Promise<string> {
  const s = await readAdminSettings();
  return s.imageModel || "gpt-image-2.5-flare";
}

export async function resolveImageQuality(): Promise<string> {
  const s = await readAdminSettings();
  return s.imageQuality || "high";
}

export async function resolveImageSize(): Promise<string> {
  const s = await readAdminSettings();
  return s.imageSize || "auto";
}

export async function resolveStripeSecret(): Promise<string> {
  const s = await readAdminSettings();
  const key = s.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return key;
}

export async function resolveStripeWebhookSecret(): Promise<string> {
  const s = await readAdminSettings();
  const key = s.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return key;
}

export async function resolveSiteUrl(): Promise<string> {
  const s = await readAdminSettings();
  return (
    s.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
