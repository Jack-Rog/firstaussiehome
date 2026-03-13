"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ResetPasswordPanel({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const router = useRouter();
  const isTokenFlow = email.length > 0 && token.length > 0;
  const [accountEmail, setAccountEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const helperText = useMemo(
    () =>
      isTokenFlow
        ? "Use at least 8 characters. After saving, we will take you back to log in."
        : "We will email a reset link to the address tied to your account.",
    [isTokenFlow],
  );

  async function handleSubmit() {
    const trimmedEmail = accountEmail.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (isTokenFlow) {
      if (password.length < 8) {
        setError("Use a password with at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("The passwords do not match.");
        return;
      }
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        isTokenFlow ? "/api/auth/password-reset/confirm" : "/api/auth/password-reset/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isTokenFlow
              ? {
                  email: trimmedEmail,
                  token,
                  password,
                }
              : {
                  email: trimmedEmail,
                },
          ),
        },
      );

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "We could not continue.");
      }

      if (isTokenFlow) {
        await signIn("credentials", {
          email: trimmedEmail,
          password,
          callbackUrl: "/first-home-dashboard",
          redirect: false,
        });
        router.push("/sign-in?callbackUrl=%2Ffirst-home-dashboard&mode=login");
        return;
      }

      setSuccess("If that email exists, a reset link is on its way.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not continue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="space-y-5 bg-[linear-gradient(180deg,#ffffff,#f7f8f4)]">
      <div className="space-y-2">
        <CardTitle>{isTokenFlow ? "Set a new password" : "Request a reset link"}</CardTitle>
        <CardText>{helperText}</CardText>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => {
            void handleSubmit();
          });
        }}
      >
        <Input
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={accountEmail}
          onChange={(event) => setAccountEmail(event.currentTarget.value)}
          disabled={isTokenFlow}
        />
        {isTokenFlow ? (
          <>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            />
          </>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : isTokenFlow ? "Save new password" : "Send reset email"}
        </Button>

        {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
        {success ? <p className="text-sm text-foreground-soft">{success}</p> : null}
      </form>

      <p className="text-xs text-foreground-soft">
        <Link href="/sign-in?callbackUrl=%2Ffirst-home-dashboard&mode=login" className="font-semibold text-primary underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}
