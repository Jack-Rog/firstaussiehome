import { ResetPasswordPanel } from "@/components/auth/reset-password-panel";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const email = typeof params.email === "string" ? params.email : "";
  const token = typeof params.token === "string" ? params.token : "";
  const isTokenFlow = email.length > 0 && token.length > 0;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_0.9fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Password recovery</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            {isTokenFlow ? "Choose a new password" : "Reset your password"}
          </h1>
          <p className="max-w-2xl text-lg text-foreground-soft">
            {isTokenFlow
              ? "Set a new password for your First Aussie Home account, then log back in to reopen your dashboard."
              : "Enter your account email and we will send a password reset link."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border bg-white/90 p-5 shadow-[0_10px_24px_rgba(33,47,37,0.06)]">
            <p className="text-sm font-semibold text-foreground">What happens next</p>
            <p className="mt-2 text-sm leading-7 text-foreground-soft">
              Reset links expire automatically. Once your password is updated, you can use the same email to access
              your saved dashboard and quiz history.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white/90 p-5 shadow-[0_10px_24px_rgba(33,47,37,0.06)]">
            <p className="text-sm font-semibold text-foreground">Account security</p>
            <p className="mt-2 text-sm leading-7 text-foreground-soft">
              Password reset emails are only sent to the account email on file. If the link expires, request a new one.
            </p>
          </div>
        </div>
      </section>

      <ResetPasswordPanel email={email} token={token} />
    </div>
  );
}
