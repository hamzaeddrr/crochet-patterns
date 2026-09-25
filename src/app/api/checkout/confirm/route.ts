import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import {
  createUnlockToken,
  recordPurchase,
  UNLOCK_COOKIE,
} from "@/lib/billing/unlock";
import { resolveSiteUrl } from "@/lib/admin/settings-store";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const slug = request.nextUrl.searchParams.get("slug") || "";
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Payment incomplete" }, { status: 400 });
    }

    const patternId = session.metadata?.patternId;
    const patternSlug = session.metadata?.patternSlug || slug;
    if (!patternId) {
      return NextResponse.json({ error: "Missing pattern" }, { status: 400 });
    }

    await recordPurchase({
      patternId,
      patternSlug,
      sessionId: session.id,
      email: session.customer_details?.email || undefined,
      amountCents: session.amount_total || 0,
      currency: session.currency || "eur",
    });

    const existing = request.cookies.get(UNLOCK_COOKIE)?.value;
    const token = createUnlockToken(patternId, existing);
    const site = await resolveSiteUrl();
    const prefix = locale === "en" ? "" : `/${locale}`;
    const res = NextResponse.redirect(
      `${site}${prefix}/patterns/${patternSlug}?unlocked=1`
    );
    res.cookies.set(UNLOCK_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (error) {
    console.error("Confirm error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Confirm failed" },
      { status: 500 }
    );
  }
}
