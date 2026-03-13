"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminPasswordGate({
  passwordConfigured,
}: {
  passwordConfigured: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordConfigured) {
      setError("Add ADMIN_PASSWORD to the environment before using this page.");
      return;
    }

    setError(null);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(payload?.error ?? "Could not unlock the admin page.");
      return;
    }

    setPassword("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="mx-auto w-full max-w-xl space-y-5 bg-[linear-gradient(180deg,#ffffff,#f5f7f2)]">
      <div className="space-y-2">
        <CardTitle>Admin access</CardTitle>
        <CardText>
          Enter the admin password to unlock survey responses, quiz entries, and analytics.
        </CardText>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">Admin password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            placeholder="Enter admin password"
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" disabled={isPending || !passwordConfigured || password.length === 0}>
          {isPending ? "Unlocking..." : "Unlock admin"}
        </Button>
      </form>
    </Card>
  );
}
