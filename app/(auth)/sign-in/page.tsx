import { SignInPanel } from "@/components/auth/sign-in-panel";
import { isDevelopmentLike, isMemoryMode } from "@/src/lib/demo-mode";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const hasEmail = Boolean(process.env.EMAIL_FROM) && !isMemoryMode();
  const hasConsoleMailer = hasEmail && !process.env.RESEND_API_KEY && isDevelopmentLike();
  const hasDemo = process.env.ENABLE_TEST_AUTH === "true" || isMemoryMode();
  const params = (await searchParams) ?? {};
  const callbackUrl =
    typeof params.callbackUrl === "string" && params.callbackUrl.startsWith("/") ? params.callbackUrl : "/";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Access your saved progress</h1>
        <p className="max-w-2xl text-lg text-foreground-soft">
          Sign in to store progress, quiz results, and bookmarks. In demo mode, a local sign-in keeps flows usable without external services.
        </p>
      </section>
      <SignInPanel
        hasEmail={hasEmail}
        hasConsoleMailer={hasConsoleMailer}
        hasDemo={hasDemo}
        callbackUrl={callbackUrl}
      />
    </div>
  );
}
