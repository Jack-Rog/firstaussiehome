import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <span className="w-fit rounded-full bg-surface px-3 py-1 text-sm font-semibold text-primary shadow-soft">
        Page not found
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">The page is not available.</h1>
      <p className="max-w-2xl text-lg text-foreground-soft">
        The link may be outdated, or the content may have moved into a newer learning path.
      </p>
      <Link
        href="/"
        className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-strong"
      >
        Return to the guide
      </Link>
    </main>
  );
}
