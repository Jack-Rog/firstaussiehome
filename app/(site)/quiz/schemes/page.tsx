import { SchemesQuiz } from "@/components/quizzes/schemes-quiz";
import { REFERENCE_LINKS } from "@/src/lib/references";

export default function SchemeQuizPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SchemesQuiz references={REFERENCE_LINKS} />
    </div>
  );
}
