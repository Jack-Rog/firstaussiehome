import Link from "next/link";
import { COMPLIANCE_BANNER_TEXT } from "@/src/lib/compliance";

export function PersistentBanner() {
  return (
    <div className="border-b border-primary/35 bg-gradient-to-r from-primary-strong to-primary text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-2.5 text-sm md:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>{COMPLIANCE_BANNER_TEXT}</p>
        <Link href="/learn#safety" className="font-semibold underline underline-offset-4">
          Safety resources
        </Link>
      </div>
    </div>
  );
}
