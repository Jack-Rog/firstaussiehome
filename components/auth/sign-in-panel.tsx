"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignInPanel({
  hasPasswordRecovery,
  hasDemo,
  callbackUrl,
  requireAccountForDashboard = false,
  mode,
  registerHref,
  loginHref,
}: {
  hasPasswordRecovery: boolean;
  hasDemo: boolean;
  callbackUrl: string;
  requireAccountForDashboard?: boolean;
  mode: "register" | "login";
  registerHref: string;
  loginHref: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modeTitle = mode === "register" ? "Create account" : "Log in";
  const modeDescription = useMemo(() => {
    if (mode === "register") {
      return "Add your name, email, and password so we can save the quiz under your account and bring you back to your dashboard.";
    }

    return "Use the same email and password you registered with to reopen your dashboard.";
  }, [mode]);

  async function handlePrimaryAction() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.replace(/\s+/g, " ").trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (mode === "register" && trimmedName.length < 2) {
      setError("Enter your full name to create the account.");
      return;
    }

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const registrationResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            password,
          }),
        });

        const registrationPayload = (await registrationResponse.json().catch(() => null)) as { error?: string } | null;
        if (!registrationResponse.ok) {
          throw new Error(registrationPayload?.error ?? "We could not create the account.");
        }
      }

      const result = (await signIn("credentials", {
        email: trimmedEmail,
        password,
        callbackUrl,
        redirect: false,
      })) as
        | {
            error?: string | null;
            url?: string | null;
          }
        | undefined;

      if (result?.error) {
        throw new Error(mode === "register" ? "We could not sign you into the new account." : "Email or password did not match.");
      }

      router.push(result?.url ?? callbackUrl);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not continue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="space-y-5 bg-[linear-gradient(180deg,#ffffff,#f7f8f4)]">
      <div className="space-y-2">
        <div className="inline-flex rounded-full border border-border bg-white p-1 text-sm">
          <Link
            href={registerHref}
            className={`rounded-full px-4 py-2 font-semibold transition-colors ${
              mode === "register" ? "bg-primary text-white" : "text-foreground-soft hover:text-foreground"
            }`}
          >
            Create account
          </Link>
          <Link
            href={loginHref}
            className={`rounded-full px-4 py-2 font-semibold transition-colors ${
              mode === "login" ? "bg-primary text-white" : "text-foreground-soft hover:text-foreground"
            }`}
          >
            Log in
          </Link>
        </div>
        <CardTitle>{requireAccountForDashboard ? "Create account or log in" : modeTitle}</CardTitle>
      </div>
      <CardText>
        {requireAccountForDashboard
          ? modeDescription
          : mode === "register"
            ? modeDescription
            : "Use the same email and password you registered with to return to your saved dashboard, progress, and bookmarks."}
      </CardText>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => {
            void handlePrimaryAction();
          });
        }}
      >
        {mode === "register" ? (
          <Input
            type="text"
            autoComplete="name"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.currentTarget.value)}
          />
        ) : null}
        <Input
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <Input
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder={mode === "register" ? "Create a password" : "Password"}
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        {mode === "register" ? (
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          />
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "register"
              ? "Creating account..."
              : "Logging in..."
            : mode === "register"
              ? "Create account"
              : "Log in"}
        </Button>
        {mode === "login" && hasPasswordRecovery ? (
          <Link
            href={`/reset-password${email ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : ""}`}
            className="inline-flex text-sm font-semibold text-primary underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        ) : null}
        <p className="text-xs text-foreground-soft">
          {mode === "register"
            ? "Passwords stay on your account so you can reopen the dashboard without relying on an email link."
            : "Use the same email and password each time you return to your account."}
        </p>
        {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
      </form>
      {hasDemo ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            startTransition(() => {
              void signIn("demo-credentials", {
                email: email || "demo@aussiesfirsthome.local",
                name: "First Aussie Home Demo User",
                callbackUrl,
              });
            })
          }
        >
          Demo sign-in
        </Button>
      ) : null}
      <p className="text-xs text-foreground-soft">
        {mode === "register"
          ? "Already have an account? Use the log in tab above to access the same dashboard with your existing email and password."
          : "New here? Use the create account tab above so your quiz and dashboard stay attached to you."}
      </p>
    </Card>
  );
}
