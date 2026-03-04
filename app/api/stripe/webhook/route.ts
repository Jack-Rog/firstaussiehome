import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { verifyWebhookEvent } from "@/src/lib/stripe";
import { updateSubscription } from "@/src/server/services/subscription-service";

function getUserIdFromEvent(event: Stripe.Event) {
  if ("metadata" in event.data.object && event.data.object.metadata?.userId) {
    return event.data.object.metadata.userId;
  }

  return null;
}

export async function POST(request: Request) {
  const payload = await request.text();
  const event = verifyWebhookEvent(payload, request.headers.get("stripe-signature"));

  if (!event) {
    return NextResponse.json({ accepted: true, mode: "demo" });
  }

  const userId = getUserIdFromEvent(event);

  if (!userId) {
    return NextResponse.json({ accepted: true, ignored: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await updateSubscription({
      userId,
      status: "active",
      stripeCustomerId: String(session.customer ?? ""),
      stripeSubscriptionId: String(session.subscription ?? ""),
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await updateSubscription({
      userId,
      status: subscription.status === "active" ? "active" : subscription.status === "trialing" ? "trialing" : "inactive",
      stripeCustomerId: String(subscription.customer ?? ""),
      stripeSubscriptionId: subscription.id,
      priceId: subscription.items.data[0]?.price.id ?? null,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null,
    });
  }

  return NextResponse.json({ accepted: true });
}
