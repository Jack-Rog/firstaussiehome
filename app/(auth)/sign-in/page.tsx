import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { isMemoryMode } from "@/src/lib/demo-mode";
import { getCurrentUser } from "@/src/lib/route-guards";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    mode?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getCurrentUser();
  const hasPasswordRecovery = Boolean(process.env.EMAIL_FROM) && !isMemoryMode();
  const hasDemo = process.env.ENABLE_TEST_AUTH === "true" || isMemoryMode();
  const params = (await searchParams) ?? {};
  const callbackUrl =
    typeof params.callbackUrl === "string" && params.callbackUrl.startsWith("/") ? params.callbackUrl : "/";
  const requireAccountForDashboard = callbackUrl === "/first-home-dashboard";
  const mode =
    params.mode === "register" || (params.mode !== "login" && requireAccountForDashboard) ? "register" : "login";
  const registerHref = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}&mode=register`;
  const loginHref = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}&mode=login`;

  if (user) {
    redirect(callbackUrl);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Account access</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            {requireAccountForDashboard && mode === "register"
              ? "Create your account to view your dashboard"
              : requireAccountForDashboard
                ? "Log in to reopen your dashboard"
              : mode === "register"
                ? "Create your First Aussie Home account"
                : "Log in to your saved dashboard"}
          </h1>
          <p className="max-w-2xl text-lg text-foreground-soft">
            {requireAccountForDashboard && mode === "register"
              ? "We'll save the quiz under your account, then take you straight to your dashboard results."
              : requireAccountForDashboard
                ? "Use the same email you registered with and we'll take you straight back to your saved dashboard results."
              : mode === "register"
                ? "Create an account once and reuse the same email to come back to your personalised dashboard, saved quiz data, and research progress."
                : "Use the email and password you registered with to reopen your dashboard, saved modelling work, and bookmarks."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border bg-white/90 p-5 shadow-[0_10px_24px_rgba(33,47,37,0.06)]">
            <p className="text-sm font-semibold text-foreground">What gets saved</p>
            <p className="mt-2 text-sm leading-7 text-foreground-soft">
              Your quiz responses, dashboard progress, and any follow-up survey you submit are linked back to your
              account so you can reopen them later.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white/90 p-5 shadow-[0_10px_24px_rgba(33,47,37,0.06)]">
            <p className="text-sm font-semibold text-foreground">How access works</p>
            <p className="mt-2 text-sm leading-7 text-foreground-soft">
              Sign in with your email and password. If password reset is enabled, we can email you a recovery link.
            </p>
          </div>
        </div>
      </section>

      <SignInPanel
        hasPasswordRecovery={hasPasswordRecovery}
        hasDemo={hasDemo}
        callbackUrl={callbackUrl}
        requireAccountForDashboard={requireAccountForDashboard}
        mode={mode}
        registerHref={registerHref}
        loginHref={loginHref}
      />
    </div>
  );
}
