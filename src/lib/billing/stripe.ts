import Stripe from "stripe";
import { resolveStripeSecret } from "@/lib/admin/settings-store";

export async function getStripe(): Promise<Stripe> {
  const key = await resolveStripeSecret();
  return new Stripe(key);
}
