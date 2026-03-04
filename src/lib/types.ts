export type LearnCategory =
  | "money-foundations"
  | "budgeting"
  | "tax"
  | "super"
  | "investing"
  | "first-home"
  | "schemes"
  | "help";

export type LearningPathId =
  | "week-1-money-reset"
  | "first-home-roadmap-nsw"
  | "tax-for-first-job"
  | "super-basics"
  | "investing-basics";

export type ReferenceKey =
  | "MONEYSMART_HOME"
  | "MONEYSMART_BUDGET"
  | "MONEYSMART_SUPER"
  | "MONEYSMART_INVESTING"
  | "ATO_HECS"
  | "ATO_PAYG"
  | "ATO_TAX_RETURN"
  | "SERVICE_NSW_FHBAS"
  | "REVENUE_NSW_FHOG"
  | "FIRSTHOME_HOME_GUARANTEE"
  | "FIRSTHOME_FHSS"
  | "ASIC_FINANCIAL_ADVISERS_REGISTER"
  | "ASIC_MONEYSMART_SCAMS"
  | "AFCA_HOME"
  | "NSW_GOV_SHARED_EQUITY"
  | "TODO_HELP_TO_BUY";

export type ExplorerCategoryId =
  | "scheme-fit"
  | "stamp-duty"
  | "deposit"
  | "time-to-save"
  | "borrowing"
  | "peer-position";

export type ExplorerStatus = "positive" | "neutral" | "watch" | "caution";

export type BenchmarkBand = {
  label: "Lower benchmark band" | "Middle benchmark band" | "Upper benchmark band";
  descriptor: string;
  sourceLabel: string;
  sourceScope: string;
  lastReviewed: string;
};

export type BorrowingRangeResult = {
  cappedBy: "serviceability-limited" | "DTI-limited" | "within broad reference band";
  affordabilityBasedMaxLoan: number;
  dtiBasedMaxLoan: number;
  illustrativeBorrowingRange: number;
  repaymentShare: number;
};

export type ExplorerMetric = {
  label: string;
  value: string;
  tone?: ExplorerStatus;
};

export type ExplorerMicroVisual = {
  kind: "progress" | "status" | "benchmark";
  value: number;
  label: string;
};

export type ExplorerSource = {
  label: string;
  href?: string;
  note: string;
};

export type GlossaryTerm = {
  term: string;
  body: string;
};

export type HomeownerPathwayId = "stamp-duty" | "deposit" | "upfront-costs";

export type HomeownerEligibilityLabel =
  | "MAY BE ELIGIBLE"
  | "NEEDS CHECK"
  | "NOT IN RANGE";

export type HomeownerEligibilityState = {
  label: HomeownerEligibilityLabel;
  tone: "positive" | "neutral" | "negative";
};

export type HomeownerPathwayInput = {
  firstHomeBuyer: boolean;
  livingInNsw: boolean;
  homeState?: "nsw" | "vic" | "qld" | "wa" | "sa" | "tas" | "act" | "nt";
  buyingArea: "state-capital" | "regional";
  buyingNewHome: boolean;
  australianCitizenOrResident: boolean;
  buyingSoloOrJoint: "solo" | "joint";
  paygOnly: boolean;
  dependants: boolean;
  businessIncome: boolean;
  existingProperty: boolean;
  age: number;
  annualSalary: number;
  privateDebt: number;
  hecsDebt: number;
  currentSavings: number;
  averageMonthlyExpenses: number;
  targetPropertyPrice: number;
  annualSavingsRate: number;
};

export type HomeownerPathwaySelections = {
  activeDepositScenario: "baseline-20" | "mid-10" | "guarantee-5" | "shared-equity-2";
  includeGuaranteeComparison: boolean;
  includeFhssConcept: boolean;
  showCashOverlay: boolean;
  expandedPathway: HomeownerPathwayId;
};

export type HomeownerPathwayMetric = {
  id: string;
  label: string;
  value: string;
  tone?: "positive" | "neutral" | "warning";
  glossaryTerm?: GlossaryTerm;
  href?: string;
};

export type PathwayScenarioOption = {
  id: "baseline-20" | "mid-10" | "guarantee-5" | "shared-equity-2";
  label: string;
  depositPercent: number;
  depositAmount: number;
  mortgageAmount: number;
  timeToSaveMonths: number;
  indicativeRepayment: number;
  estimatedPayoffYears: number;
  available: boolean;
  active: boolean;
  requiresLmi: boolean;
  statusNote?: string;
};

export type SchemeSidebarStatus = {
  id: "stamp-duty" | "guarantee" | "help-to-buy" | "fhss";
  label: string;
  state: "active" | "available" | "inactive" | "watch";
  detail: string;
  href?: string;
};

export type HomeBuyingPathwayCard = {
  id: HomeownerPathwayId;
  label: string;
  headlineValue: string;
  headlineStatus: "positive" | "neutral" | "warning";
  eligibilityState: HomeownerEligibilityState;
  microVisual: ExplorerMicroVisual;
  metrics: HomeownerPathwayMetric[];
  statusChips: string[];
  glossaryTerms: GlossaryTerm[];
  officialLinks: ReferenceKey[];
  scenarioOptions?: PathwayScenarioOption[];
  nestedToggles?: Array<{
    id: "includeGuaranteeComparison" | "includeFhssConcept";
    label: string;
    active: boolean;
  }>;
};

export type CashOutlayOverlayModel = {
  purchasePrice: number;
  depositAmount: number;
  mortgageAmount: number;
  stampDuty: number;
  otherUpfrontCosts: number;
  totalBuyerCashOutlay: number;
  financedAmount: number;
};

export type HomeownerPathwayOutput = {
  heroSummary: Array<{
    label: string;
    value: string;
  }>;
  comparisonRibbon: Array<{
    id: string;
    label: string;
    value: string;
    glossaryTerm?: GlossaryTerm;
  }>;
  eligibility: HomeownerEligibilityState;
  pathways: HomeBuyingPathwayCard[];
  schemeStatuses: SchemeSidebarStatus[];
  cashOutlayOverlay: CashOutlayOverlayModel;
  sources: ExplorerSource[];
  assumptions: string[];
  reviewDate: string;
};

export type ExplorerCategory = {
  id: ExplorerCategoryId;
  label: string;
  subtitle: string;
  headlineValue: string;
  headlineStatus: ExplorerStatus;
  microVisual: ExplorerMicroVisual;
  statusChips: string[];
  expandedMetrics: ExplorerMetric[];
  detailNotes: string[];
  officialLinks?: ReferenceKey[];
};

export type FirstHomeExplorerInput = {
  firstHomeBuyer: boolean;
  livingInNsw: boolean;
  buyingNewHome: boolean;
  australianCitizenOrResident: boolean;
  buyingSoloOrJoint: "solo" | "joint";
  paygOnly: boolean;
  dependants: boolean;
  businessIncome: boolean;
  existingProperty: boolean;
  annualSalary: number;
  privateDebt: number;
  hecsDebt: number;
  currentSavings: number;
  averageMonthlyExpenses: number;
  targetPropertyPrice: number;
  annualSavingsRate: number;
};

export type FirstHomeExplorerOutput = {
  summary: Array<{
    label: string;
    value: string;
    context: string;
  }>;
  categories: ExplorerCategory[];
  sources: ExplorerSource[];
  assumptions: string[];
  reviewDate: string;
};

export type LearnFrontmatter = {
  title: string;
  slug: string;
  summary: string;
  category: LearnCategory;
  tags: string[];
  pathIds: LearningPathId[];
  officialLinks: ReferenceKey[];
  lastReviewed: string;
  tierLabel: "Learn & Model";
};

export type LearnArticleCard = LearnFrontmatter & {
  readingTime: string;
};

export type LearningPath = {
  id: LearningPathId;
  title: string;
  description: string;
  estimatedTime: string;
  checkpoints: string[];
  slugs: string[];
};

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  tier: "free" | "pro";
  subscriptionStatus: "inactive" | "active" | "trialing" | "demo";
  demoMode: boolean;
};

export type OnboardingAnswers = {
  goals: Array<"buy-first-home" | "money-reset" | "investing-basics" | "super-tax">;
  payg: boolean;
  single: boolean;
  dependants: boolean;
  businessIncome: boolean;
  trusts: boolean;
  property: boolean;
  smallPortfolio: boolean;
  firstHomeBuyer: boolean;
  buyingNewHome: boolean;
  australianCitizenOrResident: boolean;
  livingInNsw: boolean;
  buyingSoloOrJoint: "solo" | "joint";
  annualSalary: number;
  privateDebt: number;
  hecsDebt: number;
  currentSavings: number;
  averageMonthlyExpenses: number;
  desiredPropertyPrice: number;
};

export type TierJourneyStep = {
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  title: string;
  summary: string;
  status: "now" | "next" | "later";
};

export type OnboardingResult = {
  selectedGoals: OnboardingAnswers["goals"];
  ultraSimpleTrack: boolean;
  learningPathId: LearningPathId;
  mayBeEligible: boolean;
  needsManualCheck: boolean;
  schemeSummary: string;
  officialLinks: ReferenceKey[];
  readinessChecklist: string[];
  disclaimer: string;
  calculatorPrefill: {
    annualSalary: number;
    privateDebt: number;
    hecsDebt: number;
    currentSavings: number;
    averageMonthlyExpenses: number;
    targetPropertyPrice: number;
  };
  tierJourney: TierJourneyStep[];
  nextPrimaryCta: {
    href: string;
    label: string;
  };
};

export type SchemeScreeningAnswers = {
  firstHomeBuyer: boolean;
  buyingNewHome: boolean;
  australianCitizenOrResident: boolean;
  livingInNsw: boolean;
  buyingSoloOrJoint: "solo" | "joint";
};

export type SchemeScreeningResult = {
  mayBeEligible: boolean;
  needsManualCheck: boolean;
  officialLinks: ReferenceKey[];
  assumptions: string[];
  summary: string;
};

export type DepositScenarioInput = {
  targetPropertyPrice: number;
  currentSavings: number;
  monthlySavings?: number;
  annualSavingsRate?: number;
  annualSalary?: number;
  privateDebt?: number;
  hecsDebt?: number;
  averageMonthlyExpenses?: number;
  depositTargets?: number[];
};

export type DepositScenarioRow = {
  depositPercent: number;
  targetAmount: number;
  monthsToTarget: number;
  yearsToTarget: number;
};

export type DepositScenarioOutput = {
  scenarioRows: DepositScenarioRow[];
  facts: {
    indicativeStampDuty: number;
    indicativeStampDutyAfterRelief: number;
    indicativeStampDutySaving: number;
    firstHomeGuaranteeMinimumDeposit: number;
    currentDepositPercent: number;
    currentLoanToValueRatio: number;
    projectedDebtToIncomeRatio: number;
    existingDebtToIncomeRatio: number;
    indicativeHomeLoanRepayment: number;
    indicativeDebtServicing: number;
    estimatedMonthlyBuffer: number;
  };
  infoNotes: Array<{
    id: string;
    label: string;
    body: string;
  }>;
  reviewDate: string;
  assumptions: string[];
  sensitivityNotes: string[];
};

export type BudgetCategoryKey =
  | "housing"
  | "transport"
  | "groceries"
  | "dining"
  | "utilities"
  | "subscriptions"
  | "health"
  | "education"
  | "income"
  | "transfers"
  | "uncategorized";

export type BudgetInput = {
  monthlyIncome: number;
  fixedCosts: number;
  variableCosts: number;
  irregularAnnualCosts: number;
  savingsGoal: number;
};

export type BudgetSummary = {
  monthlyTotals: {
    income: number;
    spending: number;
    irregularProvision: number;
    surplus: number;
    gapToGoal: number;
  };
  annualizedTotals: {
    income: number;
    spending: number;
    irregularProvision: number;
    surplus: number;
  };
  irregularChecklist: string[];
  exportChecklist: string[];
};

export type CsvImportRow = Record<string, string>;

export type ImportedTransactionView = {
  date: string;
  description: string;
  amount: number;
  direction: "in" | "out";
  category: BudgetCategoryKey;
  rawCategory: string | null;
  notes: string;
};

export type CsvImportResult = {
  rows: ImportedTransactionView[];
  totals: {
    income: number;
    outgoings: number;
    estimatedMonthlyCapacity: number;
  };
  categories: Record<BudgetCategoryKey, number>;
  assumptions: string[];
  warnings: string[];
};

export type ReadinessReportModel = {
  snapshot: string[];
  assumptions: string[];
  scenarioRanges: string[];
  schemeIndicators: string[];
  missingInformation: string[];
  professionalQuestions: string[];
  generatedAt: string;
};

export type FeatureFlags = {
  enableAltHomeHero: boolean;
  enableAltOnboardingResults: boolean;
  enableMonth1ReportExports: boolean;
};

export type ProgressKind = "article" | "path" | "quiz" | "tool";

export type ProgressEntryRecord = {
  id: string;
  userId: string;
  kind: ProgressKind;
  key: string;
  value: Record<string, unknown>;
  completed: boolean;
  updatedAt: string;
};

export type BookmarkRecord = {
  id: string;
  userId: string;
  slug: string;
  label: string;
  createdAt: string;
};

export type QuizSubmissionRecord = {
  id: string;
  userId: string;
  quizType: "onboarding" | "fundamentals" | "schemes";
  answers: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
};

export type SavedScenarioRecord = {
  id: string;
  userId: string;
  name: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  report: ReadinessReportModel;
  updatedAt: string;
};

export type SubscriptionRecord = {
  id: string;
  userId: string;
  status: "inactive" | "active" | "trialing" | "demo";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
};

export type BankImportRecord = {
  id: string;
  userId: string;
  fileName: string;
  rowCount: number;
  summary: CsvImportResult;
  createdAt: string;
};
