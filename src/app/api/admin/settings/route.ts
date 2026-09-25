import { NextRequest, NextResponse } from "next/server";
import {
  publicAdminSettings,
  readAdminSettings,
  saveAdminSettings,
} from "@/lib/admin/settings-store";

export async function GET() {
  const s = await readAdminSettings();
  return NextResponse.json({ settings: publicAdminSettings(s) });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const saved = await saveAdminSettings({
    openaiApiKey:
      typeof body.openaiApiKey === "string" ? body.openaiApiKey : undefined,
    contentModel:
      typeof body.contentModel === "string" ? body.contentModel : undefined,
    imageModel:
      typeof body.imageModel === "string" ? body.imageModel : undefined,
    imageQuality:
      typeof body.imageQuality === "string" ? body.imageQuality : undefined,
    imageSize: typeof body.imageSize === "string" ? body.imageSize : undefined,
    siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : undefined,
    defaultCurrency:
      typeof body.defaultCurrency === "string"
        ? body.defaultCurrency
        : undefined,
    defaultPriceCents:
      typeof body.defaultPriceCents === "number"
        ? body.defaultPriceCents
        : undefined,
    stripeSecretKey:
      typeof body.stripeSecretKey === "string"
        ? body.stripeSecretKey
        : undefined,
    stripeWebhookSecret:
      typeof body.stripeWebhookSecret === "string"
        ? body.stripeWebhookSecret
        : undefined,
    stripePublishableKey:
      typeof body.stripePublishableKey === "string"
        ? body.stripePublishableKey
        : undefined,
    adminPassword:
      typeof body.adminPassword === "string" ? body.adminPassword : undefined,
  });
  return NextResponse.json({ settings: publicAdminSettings(saved) });
}
