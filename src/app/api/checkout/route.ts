import { NextRequest, NextResponse } from "next/server";
import { getPatternBySlug } from "@/lib/data/store";
import { resolveSiteUrl } from "@/lib/admin/settings-store";
import { getStripe } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "");
    const locale = String(body.locale || "en");
    const pattern = await getPatternBySlug(slug);
    if (!pattern || pattern.status !== "published") {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }
    if (pattern.free) {
      return NextResponse.json({ error: "Pattern is free" }, { status: 400 });
    }
    if (!pattern.priceCents || pattern.priceCents <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const stripe = await getStripe();
    const site = await resolveSiteUrl();
    const prefix = locale === "en" ? "" : `/${locale}`;
    const successUrl = `${site}/api/checkout/confirm?session_id={CHECKOUT_SESSION_ID}&locale=${encodeURIComponent(locale)}&slug=${encodeURIComponent(slug)}`;
    const cancelUrl = `${site}${prefix}/patterns/${slug}?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (pattern.currency || "usd").toLowerCase(),
            unit_amount: pattern.priceCents,
            product_data: {
              name: pattern.content.title.en,
              description: pattern.content.summary.en.slice(0, 400),
              images: pattern.imagePath
                ? [`${site}${pattern.imagePath}`]
                : undefined,
              metadata: {
                patternId: pattern.id,
                patternSlug: pattern.slug,
              },
            },
          },
        },
      ],
      metadata: {
        patternId: pattern.id,
        patternSlug: pattern.slug,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
