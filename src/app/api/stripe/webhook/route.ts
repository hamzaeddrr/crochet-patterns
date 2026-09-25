import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { recordPurchase } from "@/lib/billing/unlock";
import { resolveStripeWebhookSecret } from "@/lib/admin/settings-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = await getStripe();
  const secret = await resolveStripeWebhookSecret();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("Webhook signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const patternId = session.metadata?.patternId;
    const patternSlug = session.metadata?.patternSlug || "";
    if (patternId) {
      await recordPurchase({
        patternId,
        patternSlug,
        sessionId: session.id,
        email: session.customer_details?.email || undefined,
        amountCents: session.amount_total || 0,
        currency: session.currency || "usd",
      });
    }
  }

  return NextResponse.json({ received: true });
}
