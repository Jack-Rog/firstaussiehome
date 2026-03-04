import { Card, CardText, CardTitle } from "@/components/ui/card";
import { getReferenceLinks } from "@/src/lib/references";

export default function SafetyPage() {
  const links = getReferenceLinks([
    "ASIC_FINANCIAL_ADVISERS_REGISTER",
    "ASIC_MONEYSMART_SCAMS",
    "AFCA_HOME",
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Get help safely</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Use official registers, check licensing, understand broker roles, and know where complaints can be raised.
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Check legitimacy", "Confirm licensing and registration details before acting on advice or referrals."],
          ["Broker basics", "Understand who the broker is acting for, how they are paid, and what products they can access."],
          ["Scam red flags", "Watch for urgency, pressure, fake guarantees, and requests to move money fast."],
          ["Complaint pathways", "Keep records, escalate through the provider first, then use AFCA if needed."],
        ].map(([title, text]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardText className="mt-2">{text}</CardText>
          </Card>
        ))}
      </div>
      <div className="grid gap-3">
        {links.map((link) => (
          <a key={link.key} href={link.href} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-3 font-semibold text-primary shadow-soft">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
