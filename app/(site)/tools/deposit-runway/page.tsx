import { FirstHomeDashboard } from "@/components/dashboard/first-home-dashboard";

type DepositRunwayPageProps = {
  searchParams?: Promise<{
    salary?: string;
    privateDebt?: string;
    hecsDebt?: string;
    savings?: string;
    expenses?: string;
    price?: string;
    age?: string;
  }>;
};

export default async function DepositRunwayPage({ searchParams }: DepositRunwayPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:px-6 md:py-10">
      <section className="animate-fade-up space-y-2 rounded-[1.4rem] border border-border bg-white/85 p-6 shadow-[0_12px_30px_rgba(33,47,37,0.08)]">
        <span className="inline-flex w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
          Compatibility view
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Deposit quick view</h1>
      </section>
      <div className="animate-fade-up animation-delay-100">
        <FirstHomeDashboard
          initialInput={{
            firstHomeBuyer: true,
            livingInNsw: true,
            homeState: "nsw",
            buyingArea: "state-capital",
            buyingNewHome: false,
            australianCitizenOrResident: true,
            paygOnly: true,
            dependants: false,
            businessIncome: false,
            existingProperty: false,
            age: Number(params.age) || undefined,
            annualSalary: Number(params.salary) || undefined,
            privateDebt: Number(params.privateDebt) || undefined,
            hecsDebt: Number(params.hecsDebt) || undefined,
            currentSavings: Number(params.savings) || undefined,
            averageMonthlyExpenses: Number(params.expenses) || undefined,
            targetPropertyPrice: Number(params.price) || undefined,
          }}
        />
      </div>
    </div>
  );
}
