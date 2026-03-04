import { SignInPanel } from "@/components/auth/sign-in-panel";
import { isDevelopmentLike, isMemoryMode } from "@/src/lib/demo-mode";

export default function SignInPage() {
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasEmail = Boolean(process.env.EMAIL_FROM) && !isMemoryMode();
  const hasConsoleMailer = hasEmail && !process.env.RESEND_API_KEY && isDevelopmentLike();
  const hasDemo = process.env.ENABLE_TEST_AUTH === "true" || isMemoryMode();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Access your saved progress</h1>
        <p className="max-w-2xl text-lg text-foreground-soft">
          Sign in to store progress, quiz results, and bookmarks. In demo mode, a local sign-in keeps flows usable without external services.
        </p>
      </section>
      <SignInPanel
        hasGoogle={hasGoogle}
        hasEmail={hasEmail}
        hasConsoleMailer={hasConsoleMailer}
        hasDemo={hasDemo}
      />
    </div>
  );
}
