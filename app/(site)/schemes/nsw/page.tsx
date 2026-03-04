import { Card, CardText, CardTitle } from "@/components/ui/card";
import { getReferenceLinks } from "@/src/lib/references";

export default function NswSchemesPage() {
  const links = getReferenceLinks(["SERVICE_NSW_FHBAS", "REVENUE_NSW_FHOG"]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">NSW schemes hub</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          This page explains NSW first-home support concepts and links to official criteria. Any result remains “may be eligible” until checked against the live rules.
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle>First Home Buyers Assistance Scheme</CardTitle>
          <CardText>
            A stamp duty relief concept for eligible first-home buyers, subject to current thresholds and conditions.
          </CardText>
        </Card>
        <Card className="space-y-3">
          <CardTitle>First Home Owner Grant</CardTitle>
          <CardText>
            A grant concept tied to eligible new homes, construction pathways, and current state rules.
          </CardText>
        </Card>
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
