import { redirect } from "next/navigation";
import { FirstHomeDashboard } from "@/components/dashboard/first-home-dashboard";
import { HOMEOWNER_DASHBOARD_PROGRESS_KEY, parseHomeownerDashboardSnapshot } from "@/src/lib/homeowner-dashboard-storage";
import { getCurrentUser } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";

export default async function FirstHomeDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?callbackUrl=%2Ffirst-home-dashboard");
  }

  const progressEntries = await getRepository().listProgress(user.id);
  const savedDashboardProgress = progressEntries.find(
    (entry) => entry.kind === "tool" && entry.key === HOMEOWNER_DASHBOARD_PROGRESS_KEY,
  );
  const initialSnapshot = parseHomeownerDashboardSnapshot(savedDashboardProgress?.value);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:px-6 md:py-10">
      <FirstHomeDashboard initialSnapshot={initialSnapshot} signedInUserId={user.id} />
    </div>
  );
}
