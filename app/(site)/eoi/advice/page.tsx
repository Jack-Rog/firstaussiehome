import Link from "next/link";
import { Card, CardText, CardTitle } from "@/components/ui/card";

export default function AdviceEoiPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 md:px-6 md:py-10">
      <Card className="animate-fade-up space-y-4 bg-white/92">
        <CardTitle>Tools + support research now lives in one place</CardTitle>
        <CardText>
          Future tools and possible low-cost human support now share one research flow so we can focus on real problems instead of feature wishlists.
        </CardText>
        <Link
          href="/eoi/tools"
          className="inline-flex w-fit rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          Open Tools + Support Research
        </Link>
      </Card>
    </div>
  );
}
