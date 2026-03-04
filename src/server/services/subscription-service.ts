import { getRepository } from "@/src/server/repositories/repository";

export async function getSubscription(userId: string) {
  const repository = getRepository();
  return repository.getSubscription(userId);
}

export async function updateSubscription(input: {
  userId: string;
  status: "inactive" | "active" | "trialing" | "demo";
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  priceId?: string | null;
  currentPeriodEnd?: string | null;
}) {
  const repository = getRepository();
  return repository.setSubscription(input);
}
