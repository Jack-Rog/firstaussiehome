import { NextResponse } from "next/server";
import { isPaymentsDemoMode } from "@/src/lib/demo-mode";
import { createCheckoutSession, createSignedProDemoCookieValue, getProDemoCookieName, allowProDemoCookie } from "@/src/lib/stripe";
import { getCurrentUser } from "@/src/lib/route-guards";
import { updateSubscription } from "@/src/server/services/subscription-service";

export async function POST() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const session = await createCheckoutSession({
    userId,
    email: user?.email,
  });

  if (session.demo && isPaymentsDemoMode()) {
    const response = NextResponse.redirect(
      new URL("/model?demo=1", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );

    if (allowProDemoCookie()) {
      response.cookies.set(getProDemoCookieName(), createSignedProDemoCookieValue(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      await updateSubscription({
        userId,
        status: "demo",
        priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_demo",
      });
    }

    return response;
  }

  return NextResponse.redirect(session.url);
}
