import { LearningPathList } from "@/components/learn/learning-path-list";
import { listLearningPaths } from "@/src/lib/learning-paths";
import { getActiveUserId } from "@/src/lib/route-guards";
import { listProgress } from "@/src/server/services/progress-service";

export default async function PathsPage() {
  const userId = await getActiveUserId();
  const progress = await listProgress(userId);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Learning paths</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Follow short, structured paths built for day-one clarity. Progress can be saved in the database or the in-memory demo layer.
        </p>
      </section>
      <LearningPathList paths={listLearningPaths()} progress={progress} />
    </div>
  );
}
