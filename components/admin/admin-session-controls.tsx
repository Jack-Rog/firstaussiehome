"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AdminSessionControls({
  canLock,
}: {
  canLock: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!canLock) {
    return null;
  }

  async function handleLock() {
    await fetch("/api/admin/session", {
      method: "DELETE",
    });

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="secondary" onClick={handleLock} disabled={isPending}>
      {isPending ? "Locking..." : "Lock admin"}
    </Button>
  );
}
