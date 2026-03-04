import { Card, CardText, CardTitle } from "@/components/ui/card";
import { getReferenceLinks } from "@/src/lib/references";

export default function FederalSchemesPage() {
  const links = getReferenceLinks([
    "FIRSTHOME_FHSS",
    "FIRSTHOME_HOME_GUARANTEE",
    "TODO_HELP_TO_BUY",
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Federal scheme awareness</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          The federal hub covers the broad concepts behind FHSS, guarantee pathways, and shared equity programs. It does not predict eligibility or outcomes.
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardTitle>FHSS concept</CardTitle>
          <CardText className="mt-2">A super-linked pathway that uses specific release rules and contribution limits.</CardText>
        </Card>
        <Card>
          <CardTitle>5% deposit guarantee concept</CardTitle>
          <CardText className="mt-2">A federal guarantee framework that can reduce deposit size requirements for eligible applicants.</CardText>
        </Card>
        <Card>
          <CardTitle>Shared equity concept</CardTitle>
          <CardText className="mt-2">A co-investment model that can change ownership structure and future obligations.</CardText>
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
