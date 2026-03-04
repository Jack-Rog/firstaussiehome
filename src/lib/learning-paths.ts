import type { LearningPath, LearningPathId } from "@/src/lib/types";

export const LEARNING_PATHS: Record<LearningPathId, LearningPath> = {
  "week-1-money-reset": {
    id: "week-1-money-reset",
    title: "Week 1 Money Reset",
    description: "A short, low-friction reset to understand cash flow, habits, and simple planning routines.",
    estimatedTime: "7 short sessions",
    checkpoints: ["Map fixed costs", "List irregular costs", "Set a weekly money check-in"],
    slugs: ["budgeting-methods", "irregular-expenses", "emergency-fund-basics", "behavioural-biases"],
  },
  "first-home-roadmap-nsw": {
    id: "first-home-roadmap-nsw",
    title: "First Home Roadmap (NSW)",
    description: "A guided learning path covering deposits, costs, schemes, and common property-buying terms.",
    estimatedTime: "10 short sessions",
    checkpoints: ["Understand deposit ranges", "Review scheme concepts", "List ongoing property costs"],
    slugs: [
      "deposit-basics",
      "lvr-and-lmi",
      "offset-vs-redraw",
      "fixed-vs-variable",
      "pre-approval-concepts",
      "settlement-basics",
      "strata-and-ongoing-costs",
      "nsw-fhbas-concept",
      "nsw-fhog-concept",
      "home-guarantee-concept",
    ],
  },
  "tax-for-first-job": {
    id: "tax-for-first-job",
    title: "Tax for First Job (PAYG)",
    description: "Plain-English coverage of payslips, PAYG, Medicare, HELP, and first tax return basics.",
    estimatedTime: "6 short sessions",
    checkpoints: ["Read a payslip", "Know the PAYG concept", "Know tax-time records to keep"],
    slugs: ["payg-basics", "marginal-vs-average-tax", "medicare-basics", "hecs-help-basics", "tax-return-basics"],
  },
  "super-basics": {
    id: "super-basics",
    title: "Super Basics",
    description: "A beginner path for how super works, common account features, and practical housekeeping tasks.",
    estimatedTime: "5 short sessions",
    checkpoints: ["Know where super can be found", "Understand contributions basics", "Review insurance basics"],
    slugs: ["why-super-matters", "super-contributions-basics", "insurance-in-super-basics", "find-and-combine-super"],
  },
  "investing-basics": {
    id: "investing-basics",
    title: "Investing Basics",
    description: "Conceptual investing education focused on time horizon, diversification, and risk framing.",
    estimatedTime: "6 short sessions",
    checkpoints: ["Understand active vs passive", "Understand diversification", "Understand time horizon"],
    slugs: [
      "active-vs-passive",
      "etfs-vs-managed-funds",
      "diversification-basics",
      "time-horizon-basics",
      "risk-across-life-stages",
    ],
  },
};

export function getLearningPath(pathId: LearningPathId) {
  return LEARNING_PATHS[pathId];
}

export function listLearningPaths() {
  return Object.values(LEARNING_PATHS);
}
