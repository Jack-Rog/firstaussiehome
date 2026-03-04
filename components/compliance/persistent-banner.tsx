import Link from "next/link";
import { COMPLIANCE_BANNER_TEXT } from "@/src/lib/compliance";

export function PersistentBanner() {
  return (
    <div className="border-b border-border bg-primary-strong text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>{COMPLIANCE_BANNER_TEXT}</p>
        <Link href="/safety" className="font-semibold underline underline-offset-4">
          Get help safely
        </Link>
      </div>
    </div>
  );
}
