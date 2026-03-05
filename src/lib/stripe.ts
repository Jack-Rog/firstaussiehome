import crypto from "node:crypto";
import Stripe from "stripe";
import { isDevelopmentLike, isStripeConfigured } from "@/src/lib/demo-mode";

const PRO_DEMO_COOKIE = "youngmoney_pro_demo";

function getSigningSecret() {
  return process.env.AUTH_SECRET ?? "youngmoney-demo-secret";
}

function signValue(value: string) {
  return crypto.createHmac("sha256", getSigningSecret()).update(value).digest("hex");
}

export function getProDemoCookieName() {
  return PRO_DEMO_COOKIE;
}

export function createSignedProDemoCookieValue() {
  const payload = "enabled";
  return `${payload}.${signValue(payload)}`;
}

export function hasValidProDemoCookie(value: string | undefined) {
  if (!value) {
    return false;
  }

  const [payload, signature] = value.split(".");
  return payload === "enabled" && signature === signValue(payload);
}

export function getStripeClient() {
  if (!isStripeConfigured() || !process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createCheckoutSession(input: { userId: string; email?: string | null }) {
  const stripe = getStripeClient();

  if (!stripe || !process.env.STRIPE_PRO_PRICE_ID) {
    return {
      demo: true,
      url: `${getAppUrl()}/model`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${getAppUrl()}/model?checkout=success`,
    cancel_url: `${getAppUrl()}/eoi/tools?checkout=cancelled`,
    client_reference_id: input.userId,
    customer_email: input.email ?? undefined,
    metadata: {
      userId: input.userId,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
      },
    },
  });

  return {
    demo: false,
    url: session.url ?? `${getAppUrl()}/eoi/tools`,
  };
}

export function allowProDemoCookie() {
  return isDevelopmentLike();
}

export function verifyWebhookEvent(payload: string, signature: string | null) {
  const stripe = getStripeClient();

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return null;
  }

  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
