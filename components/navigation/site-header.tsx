import Link from "next/link";
import { AussiesFirstHomeLogo } from "@/components/branding/aussies-first-home-logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/First-Home-Quiz", label: "First Home Quiz" },
  { href: "/learn", label: "Learn" },
  { href: "/safety", label: "Safety" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-[#faf7f0]/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0">
          <AussiesFirstHomeLogo />
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-soft"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={"/eoi/advice" as never}
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-soft"
          >
            Licensed advice (coming soon)
          </Link>
        </nav>
      </div>
    </header>
  );
}
