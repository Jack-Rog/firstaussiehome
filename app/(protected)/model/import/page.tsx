import { CsvImportForm } from "@/components/model/csv-import-form";
import { PaywallCard } from "@/components/model/paywall-card";
import { isPaymentsDemoMode } from "@/src/lib/demo-mode";
import { hasProAccess } from "@/src/lib/route-guards";

export default async function ModelImportPage() {
  const proAccess = await hasProAccess();

  if (!proAccess) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <PaywallCard paymentsDemo={isPaymentsDemoMode()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <CsvImportForm />
    </div>
  );
}
