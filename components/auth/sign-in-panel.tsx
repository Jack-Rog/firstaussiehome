"use client";

import { startTransition, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignInPanel({
  hasGoogle,
  hasEmail,
  hasConsoleMailer,
  hasDemo,
}: {
  hasGoogle: boolean;
  hasEmail: boolean;
  hasConsoleMailer: boolean;
  hasDemo: boolean;
}) {
  const [email, setEmail] = useState("demo@aussiesfirsthome.local");

  return (
    <Card className="space-y-5">
      <CardTitle>Sign in</CardTitle>
      <CardText>
        Use Google, a magic link, or the local demo sign-in when the app is running without full integrations.
      </CardText>
      {hasGoogle ? (
        <Button type="button" onClick={() => void signIn("google", { callbackUrl: "/" })}>
          Continue with Google
        </Button>
      ) : null}
      {hasEmail ? (
        <div className="space-y-3">
          <Input type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              startTransition(() => {
                void signIn("email", { email, callbackUrl: "/" });
              })
            }
          >
            Send magic link
          </Button>
          {hasConsoleMailer ? (
            <p className="text-xs text-foreground-soft">
              Dev console mailer enabled. Magic links are printed to the terminal instead of being sent.
            </p>
          ) : null}
        </div>
      ) : null}
      {hasDemo ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            startTransition(() => {
              void signIn("credentials", {
                email,
                name: "First Aussie Home Demo User",
                callbackUrl: "/model",
              });
            })
          }
        >
          Demo sign-in
        </Button>
      ) : null}
    </Card>
  );
}
