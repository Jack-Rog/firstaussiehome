export function isMemoryMode() {
  return process.env.USE_MEMORY_DB === "true" || !process.env.DATABASE_URL;
}

export function isDevelopmentLike() {
  return process.env.NODE_ENV !== "production";
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRO_PRICE_ID,
  );
}

export function isPaymentsDemoMode() {
  return !isStripeConfigured();
}
