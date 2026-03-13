import {
  BENCHMARK_REVIEW_DATE,
  getDepositBenchmark,
  getExpenseBenchmark,
  getIncomeBenchmark,
  listBenchmarkSources,
} from "@/src/lib/benchmarks/first-home-benchmarks";
import { deriveDutyIntakeState } from "@/src/lib/analysis/homeowner-duty-intake";
import { REFERENCE_LINKS } from "@/src/lib/references";
import { getStampDutyMemory } from "@/src/lib/state-scheme-memory";
import type {
  CashOutlayOverlayModel,
  ExplorerSource,
  HomeBuyingPathwayCard,
  HomeownerEligibilityState,
  HomeownerPathwayInput,
  HomeownerPathwayOutput,
  HomeownerPathwaySelections,
  PathwayScenarioOption,
  ReferenceKey,
} from "@/src/lib/types";
import { formatCurrency, formatPercent } from "@/src/lib/utils";
import {
  STAMP_DUTY_MODEL_DATE,
  calculateStampDuty,
  type Jurisdiction,
  type PropertyType,
} from "@/src/lib/stampDuty";

export const HOMEOWNER_PATHWAY_REVIEW_DATE = "2026-03-11";
const HOME_LOAN_COMPARISON_RATE = 6.1;
export const CURRENT_MARKET_OWNER_OCCUPIER_RATE = 5.42;
const HOME_LOAN_TERM_YEARS = 30;
const PRIVATE_DEBT_RATE = 8.5;
const PRIVATE_DEBT_TERM_YEARS = 5;
const SIMPLE_MEDICARE_RATE = 0.02;
const ACT_HBCS_INCOME_SETTINGS = {
  effectiveFrom: "2024-07-01",
  baseThreshold: 250000,
  perDependentChild: 4600,
  maxDependentChildrenCount: 5,
} as const;
const FIRST_HOME_GUARANTEE_CAPS = {
  nsw: { "state-capital": 1500000, regional: 800000 },
  vic: { "state-capital": 950000, regional: 650000 },
  qld: { "state-capital": 1000000, regional: 700000 },
  wa: { "state-capital": 850000, regional: 600000 },
  sa: { "state-capital": 900000, regional: 500000 },
  tas: { "state-capital": 700000, regional: 550000 },
  act: { "state-capital": 1000000, regional: 1000000 },
  nt: { "state-capital": 600000, regional: 600000 },
} as const;
const HELP_TO_BUY_CAPS = {
  nsw: { "state-capital": 1300000, regional: 800000 },
  vic: { "state-capital": 950000, regional: 650000 },
  qld: { "state-capital": 1000000, regional: 700000 },
  wa: { "state-capital": 850000, regional: 600000 },
  sa: { "state-capital": 900000, regional: 500000 },
  tas: { "state-capital": 700000, regional: 550000 },
  act: { "state-capital": 1000000, regional: 1000000 },
  nt: { "state-capital": 600000, regional: 600000 },
} as const;
const HELP_TO_BUY_SUPPORTED_STATES = {
  nsw: true,
  vic: true,
  qld: true,
  wa: true,
  sa: true,
  tas: false,
  act: true,
  nt: true,
} as const;
export const PURCHASE_COST_BANDS = [
  {
    label: "Up to $600k",
    maxPrice: 600000,
    professionalFees: 1600,
    disbursements: 550,
    stampingFee: 180,
    registrationFees: 351.4,
    pexaFee: 210.76,
  },
  {
    label: "$600k to $900k",
    maxPrice: 900000,
    professionalFees: 1800,
    disbursements: 650,
    stampingFee: 180,
    registrationFees: 351.4,
    pexaFee: 210.76,
  },
  {
    label: "$900k to $1.2m",
    maxPrice: 1200000,
    professionalFees: 2100,
    disbursements: 700,
    stampingFee: 200,
    registrationFees: 351.4,
    pexaFee: 210.76,
  },
  {
    label: "Over $1.2m",
    maxPrice: Number.POSITIVE_INFINITY,
    professionalFees: 2500,
    disbursements: 800,
    stampingFee: 220,
    registrationFees: 351.4,
    pexaFee: 210.76,
  },
] as const;
const HOME_STATE_LABELS = {
  nsw: "NSW",
  vic: "Victoria",
  qld: "Queensland",
  wa: "Western Australia",
  sa: "South Australia",
  tas: "Tasmania",
  act: "ACT",
  nt: "NT",
} as const;

export const DEFAULT_HOMEOWNER_PATHWAY_INPUT: HomeownerPathwayInput = {
  firstHomeBuyer: false,
  livingInNsw: true,
  homeState: "nsw",
  buyingArea: "state-capital",
  buyingNewHome: false,
  australianCitizenOrResident: false,
  buyingSoloOrJoint: "solo",
  ownerOccupier: true,
  foreignBuyer: false,
  propertyTypeDetailed: "established-home",
  dependentChildrenCount: undefined,
  paygOnly: false,
  dependants: false,
  businessIncome: false,
  existingProperty: false,
  age: 27,
  annualSalary: 85000,
  actHouseholdIncome: 85000,
  privateDebt: 12000,
  hecsDebt: 18000,
  currentSavings: 45000,
  averageMonthlyExpenses: 2800,
  targetPropertyPrice: 780000,
  annualSavingsRate: 3,
};

export const DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS: HomeownerPathwaySelections = {
  activeDepositScenario: "baseline-20",
  includeGuaranteeComparison: true,
  includeFhssConcept: true,
  showCashOverlay: false,
  expandedPathway: "stamp-duty",
};

function clampMoney(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function calculateSimpleIncomeTax(grossAnnualIncome: number) {
  if (grossAnnualIncome <= 18200) {
    return 0;
  }

  if (grossAnnualIncome <= 45000) {
    return (grossAnnualIncome - 18200) * 0.16;
  }

  if (grossAnnualIncome <= 135000) {
    return 4288 + (grossAnnualIncome - 45000) * 0.3;
  }

  if (grossAnnualIncome <= 190000) {
    return 31288 + (grossAnnualIncome - 135000) * 0.37;
  }

  return 51638 + (grossAnnualIncome - 190000) * 0.45;
}

function calculateSimpleNetAnnualIncome(grossAnnualIncome: number) {
  const taxableIncome = Math.max(grossAnnualIncome, 0);
  const incomeTax = calculateSimpleIncomeTax(taxableIncome);
  const medicare = taxableIncome * SIMPLE_MEDICARE_RATE;
  return Math.max(taxableIncome - incomeTax - medicare, 0);
}

function amortizedMonthlyRepayment(principal: number, annualRate: number, termYears: number) {
  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const periods = termYears * 12;

  if (monthlyRate === 0) {
    return principal / periods;
  }

  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
}

function calculatePayoffYears(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  defaultYears: number,
) {
  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const minimumPayment = amortizedMonthlyRepayment(principal, annualRate, defaultYears);
  const appliedPayment = Math.max(monthlyPayment, minimumPayment);

  if (appliedPayment <= principal * monthlyRate) {
    return defaultYears;
  }

  const months = Math.log(appliedPayment / (appliedPayment - principal * monthlyRate)) / Math.log(1 + monthlyRate);
  return Number((months / 12).toFixed(1));
}

function calculateScaledSetupCosts(targetPropertyPrice: number) {
  const band =
    PURCHASE_COST_BANDS.find((entry) => targetPropertyPrice > 0 && targetPropertyPrice <= entry.maxPrice) ??
    PURCHASE_COST_BANDS[0];
  const professionalFees = band.professionalFees;
  const disbursements = band.disbursements;
  const stampingFee = band.stampingFee;
  const registrationFees = band.registrationFees;
  const pexaFee = band.pexaFee;
  const total = professionalFees + disbursements + stampingFee + registrationFees + pexaFee;

  return {
    label: band.label,
    professionalFees,
    disbursements,
    stampingFee,
    registrationFees,
    pexaFee,
    total,
  };
}

function calculateTimeToSave(
  currentSavings: number,
  targetAmount: number,
  monthlySavings: number,
  annualSavingsRate: number,
) {
  let savings = currentSavings;
  let months = 0;

  while (savings < targetAmount && months < 1200) {
    savings += monthlySavings;

    if ((months + 1) % 12 === 0) {
      savings *= 1 + annualSavingsRate / 100;
    }

    months += 1;
  }

  return months;
}

function getAgeCohort(age: number) {
  if (age <= 24) {
    return "peers 18-24";
  }

  if (age <= 34) {
    return "peers 25-34";
  }

  if (age <= 44) {
    return "peers 35-44";
  }

  return "peers 45+";
}

function getEligibilityState(input: HomeownerPathwayInput): HomeownerEligibilityState {
  const mayBeEligible =
    input.firstHomeBuyer &&
    !input.existingProperty &&
    input.australianCitizenOrResident;

  if (mayBeEligible) {
    return {
      label: "MAY BE ELIGIBLE",
      tone: "positive",
    };
  }

  const needsCheck =
    !input.paygOnly ||
    input.dependants ||
    input.businessIncome;

  if (needsCheck) {
    return {
      label: "NEEDS CHECK",
      tone: "neutral",
    };
  }

  return {
    label: "NOT IN RANGE",
    tone: "negative",
  };
}

function buildSources(keys: ReferenceKey[]): ExplorerSource[] {
  const seen = new Set<string>();
  const unique = keys.filter((key) => {
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return [
    ...unique.map((key) => ({
      label: REFERENCE_LINKS[key].label,
      href: REFERENCE_LINKS[key].href,
      note: REFERENCE_LINKS[key].note,
    })),
    ...listBenchmarkSources(),
  ];
}

function toJurisdiction(state: NonNullable<HomeownerPathwayInput["homeState"]>): Jurisdiction {
  return state.toUpperCase() as Jurisdiction;
}

function normalizePropertyTypeDetailed(input: HomeownerPathwayInput) {
  if (input.propertyTypeDetailed) {
    return input.propertyTypeDetailed;
  }

  return input.buyingNewHome ? "new-home" : "established-home";
}

function toPropertyType(input: HomeownerPathwayInput): PropertyType {
  const propertyTypeDetailed = normalizePropertyTypeDetailed(input);

  switch (propertyTypeDetailed) {
    case "new-home":
      return "new_home";
    case "vacant-land":
      return "vacant_land";
    case "off-the-plan-home":
      return "off_the_plan_apartment";
    case "house-and-land-package":
      return "house_and_land_package";
    default:
      return "established_home";
  }
}

function formatDutyText(value: string, uncertaintyActive: boolean) {
  return uncertaintyActive ? `${value}*` : value;
}

function formatDutyCurrency(value: number, uncertaintyActive: boolean) {
  return formatDutyText(formatCurrency(value), uncertaintyActive);
}

function getActHbcsIncomeThreshold(input: HomeownerPathwayInput, transactionDate: string) {
  if (new Date(transactionDate).getTime() < new Date(ACT_HBCS_INCOME_SETTINGS.effectiveFrom).getTime()) {
    return null;
  }

  const dependentChildrenCount = Math.max(input.dependentChildrenCount ?? 0, 0);
  const cappedDependentChildrenCount = Math.min(
    Math.max(dependentChildrenCount, 0),
    ACT_HBCS_INCOME_SETTINGS.maxDependentChildrenCount,
  );

  return (
    ACT_HBCS_INCOME_SETTINGS.baseThreshold +
    ACT_HBCS_INCOME_SETTINGS.perDependentChild * cappedDependentChildrenCount
  );
}

function getStateSpecificDutyInputs(input: HomeownerPathwayInput, stampDutyEligibilityFlag: boolean) {
  const homeState = input.homeState ?? "nsw";

  if (homeState === "wa") {
    return {
      wa_region:
        input.waRegion === "perth-peel"
          ? "metro_or_peel"
          : input.waRegion === "outside-perth-peel"
            ? "regional"
            : input.buyingArea === "state-capital"
              ? "metro_or_peel"
              : "regional",
    };
  }

  if (homeState === "act") {
    const incomeThreshold = getActHbcsIncomeThreshold(input, STAMP_DUTY_MODEL_DATE);
    const incomeEligible =
      incomeThreshold !== null &&
      input.actHouseholdIncome <= incomeThreshold &&
      stampDutyEligibilityFlag;

    return {
      act_household_income: input.actHouseholdIncome,
      act_hbcs_income_threshold: incomeThreshold,
      act_hbcs_income_eligible: incomeEligible,
    };
  }

  return {};
}

export function buildHomeownerPathwayOutput(
  partialInput: Partial<HomeownerPathwayInput>,
  partialSelections?: Partial<HomeownerPathwaySelections>,
): HomeownerPathwayOutput {
  const normalizedPropertyTypeDetailed =
    partialInput.propertyTypeDetailed ??
    (partialInput.buyingNewHome === undefined
      ? DEFAULT_HOMEOWNER_PATHWAY_INPUT.propertyTypeDetailed
      : partialInput.buyingNewHome
        ? "new-home"
        : "established-home");
  const normalizedDependentChildrenCount = Math.max(
    0,
    Number.isFinite(partialInput.dependentChildrenCount as number)
      ? Number(partialInput.dependentChildrenCount)
      : partialInput.dependants
        ? 1
        : DEFAULT_HOMEOWNER_PATHWAY_INPUT.dependentChildrenCount ?? 0,
  );
  const input: HomeownerPathwayInput = {
    ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
    ...partialInput,
    homeState: partialInput.homeState ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.homeState,
    propertyTypeDetailed: normalizedPropertyTypeDetailed,
    buyingNewHome:
      normalizedPropertyTypeDetailed === "new-home" ||
      normalizedPropertyTypeDetailed === "off-the-plan-home" ||
      normalizedPropertyTypeDetailed === "house-and-land-package",
    dependentChildrenCount: normalizedDependentChildrenCount,
    dependants: normalizedDependentChildrenCount > 0 || Boolean(partialInput.dependants),
    age: Math.max(18, Number.isFinite(partialInput.age as number) ? Number(partialInput.age) : DEFAULT_HOMEOWNER_PATHWAY_INPUT.age),
    annualSalary: clampMoney(partialInput.annualSalary ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.annualSalary),
    actHouseholdIncome: clampMoney(partialInput.actHouseholdIncome ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.actHouseholdIncome),
    privateDebt: clampMoney(partialInput.privateDebt ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.privateDebt),
    hecsDebt: clampMoney(partialInput.hecsDebt ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.hecsDebt),
    currentSavings: clampMoney(partialInput.currentSavings ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.currentSavings),
    averageMonthlyExpenses: clampMoney(
      partialInput.averageMonthlyExpenses ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.averageMonthlyExpenses,
    ),
    targetPropertyPrice: clampMoney(
      partialInput.targetPropertyPrice ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.targetPropertyPrice,
    ),
    annualSavingsRate: clampMoney(
      partialInput.annualSavingsRate ?? DEFAULT_HOMEOWNER_PATHWAY_INPUT.annualSavingsRate,
    ),
  };

  const selections: HomeownerPathwaySelections = {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    ...partialSelections,
  };

  const isNsw = (input.homeState ?? "nsw") === "nsw";
  input.livingInNsw = isNsw;
  const eligibility = getEligibilityState(input);
  const dutyIntake = deriveDutyIntakeState(input);
  const stateKey = input.homeState ?? "nsw";
  const stampDutyMemory = getStampDutyMemory(stateKey, input.buyingArea);
  const stateSpecificDutyInputs = getStateSpecificDutyInputs(input, eligibility.label === "MAY BE ELIGIBLE");
  const dutyCommonInput = {
    state: toJurisdiction(stateKey),
    property_value: input.targetPropertyPrice,
    property_type: toPropertyType(input),
    transaction_date: STAMP_DUTY_MODEL_DATE,
    foreign_buyer: input.foreignBuyer ?? false,
    state_specific_inputs: stateSpecificDutyInputs,
  };
  const standardDutyResult = calculateStampDuty({
    ...dutyCommonInput,
    first_home_buyer: false,
    owner_occupier: input.ownerOccupier ?? true,
  });
  const schemeDutyResult =
    eligibility.label === "MAY BE ELIGIBLE" && selections.includeGuaranteeComparison
      ? calculateStampDuty({
          ...dutyCommonInput,
          first_home_buyer: true,
          owner_occupier: input.ownerOccupier ?? true,
        })
      : standardDutyResult;
  const standardDuty = standardDutyResult.finalDuty;
  const schemeDuty = schemeDutyResult.finalDuty;
  const dutySaving = Math.max(standardDuty - schemeDuty, 0);
  const stampDutyUnresolved = standardDutyResult.unresolved || schemeDutyResult.unresolved;
  const dutyUncertaintyActive = dutyIntake.uncertaintyActive;
  const stampDutySourceUrls = [...new Set([...standardDutyResult.sourceUrls, ...schemeDutyResult.sourceUrls])];
  const guaranteeCap = FIRST_HOME_GUARANTEE_CAPS[stateKey][input.buyingArea];
  const helpToBuyCap = HELP_TO_BUY_CAPS[stateKey][input.buyingArea];
  const firstHomeGuaranteeAvailable =
    eligibility.label === "MAY BE ELIGIBLE" &&
    input.targetPropertyPrice <= guaranteeCap;
  const helpToBuyAvailable =
    HELP_TO_BUY_SUPPORTED_STATES[stateKey] &&
    eligibility.label === "MAY BE ELIGIBLE" &&
    input.targetPropertyPrice <= helpToBuyCap;
  const netMonthlyIncome = calculateSimpleNetAnnualIncome(input.annualSalary) / 12;
  const privateDebtServicing = amortizedMonthlyRepayment(
    input.privateDebt,
    PRIVATE_DEBT_RATE,
    PRIVATE_DEBT_TERM_YEARS,
  );
  const monthlySavingsCapacity = Math.max(netMonthlyIncome - input.averageMonthlyExpenses - privateDebtServicing, 0);
  const scaledSetupCosts = calculateScaledSetupCosts(input.targetPropertyPrice);

  const scenarioBase: Array<{
    id: PathwayScenarioOption["id"];
    label: string;
    depositPercent: number;
    availability: boolean;
    requiresLmi: boolean;
    statusNote?: string;
  }> = [
    {
      id: "baseline-20",
      label: "20%",
      depositPercent: 20,
      availability: true,
      requiresLmi: false,
      statusNote: "No scheme needed",
    },
    {
      id: "mid-10",
      label: "10%",
      depositPercent: 10,
      availability: true,
      requiresLmi: true,
      statusNote: "No scheme needed",
    },
    {
      id: "guarantee-5",
      label: "5%",
      depositPercent: 5,
      availability: firstHomeGuaranteeAvailable && selections.includeGuaranteeComparison,
      requiresLmi: false,
      statusNote: firstHomeGuaranteeAvailable
        ? "Needs First Home Guarantee"
        : `Outside the broad ${formatCurrency(guaranteeCap)} band`,
    },
    {
      id: "shared-equity-2",
      label: "2%",
      depositPercent: 2,
      availability: helpToBuyAvailable && selections.includeGuaranteeComparison,
      requiresLmi: false,
      statusNote: helpToBuyAvailable
        ? "Needs Help to Buy"
        : `Outside the broad ${formatCurrency(helpToBuyCap)} band`,
    },
  ];

  const scenarioOptions = scenarioBase.map((scenario) => {
    const depositAmount = input.targetPropertyPrice * (scenario.depositPercent / 100);
    const mortgageAmount = Math.max(input.targetPropertyPrice - depositAmount, 0);
    const timeToSaveMonths = calculateTimeToSave(
      input.currentSavings,
      depositAmount,
      monthlySavingsCapacity,
      input.annualSavingsRate,
    );
    const indicativeRepayment = amortizedMonthlyRepayment(
      mortgageAmount,
      HOME_LOAN_COMPARISON_RATE,
      HOME_LOAN_TERM_YEARS,
    );
    const mortgageCapacity = Math.max(netMonthlyIncome - input.averageMonthlyExpenses - privateDebtServicing, 0);
    const estimatedPayoffYears = calculatePayoffYears(
      mortgageAmount,
      HOME_LOAN_COMPARISON_RATE,
      mortgageCapacity,
      HOME_LOAN_TERM_YEARS,
    );

    return {
      id: scenario.id,
      label: scenario.label,
      depositPercent: scenario.depositPercent,
      depositAmount,
      mortgageAmount,
      timeToSaveMonths,
      indicativeRepayment,
      estimatedPayoffYears,
      available: scenario.availability,
      active: selections.activeDepositScenario === scenario.id,
      requiresLmi: scenario.requiresLmi,
      statusNote: scenario.statusNote,
    };
  });

  const activeScenario =
    scenarioOptions.find((scenario) => scenario.id === selections.activeDepositScenario && scenario.available) ??
    scenarioOptions[0];

  const otherUpfrontCosts = {
    low: scaledSetupCosts.total * 0.9,
    mid: scaledSetupCosts.total,
    high: scaledSetupCosts.total * 1.1,
  };

  const cashOutlayOverlay: CashOutlayOverlayModel = {
    purchasePrice: input.targetPropertyPrice,
    depositAmount: activeScenario.depositAmount,
    mortgageAmount: activeScenario.mortgageAmount,
    stampDuty: schemeDuty,
    otherUpfrontCosts: otherUpfrontCosts.mid,
    totalBuyerCashOutlay: activeScenario.depositAmount + schemeDuty + otherUpfrontCosts.mid,
    financedAmount: activeScenario.mortgageAmount,
  };

  const currentLvr = input.targetPropertyPrice === 0 ? 0 : (activeScenario.mortgageAmount / input.targetPropertyPrice) * 100;
  const savingsBand = getDepositBenchmark(input.currentSavings, input.targetPropertyPrice);
  const incomeBand = getIncomeBenchmark(input.annualSalary);
  const expenseBand = getExpenseBenchmark(input.averageMonthlyExpenses, netMonthlyIncome);
  const lvrFriction =
    currentLvr > 95
      ? "Very high leverage"
      : currentLvr > 80
        ? "Higher-friction setup"
        : "Lower-friction setup";

  const stampDutyPathway: HomeBuyingPathwayCard = {
    id: "stamp-duty",
    label: dutyUncertaintyActive ? "Stamp Duty*" : "Stamp Duty",
    headlineValue: dutySaving > 0 ? formatDutyCurrency(dutySaving, dutyUncertaintyActive) : formatDutyCurrency(schemeDuty, dutyUncertaintyActive),
    headlineStatus: dutyUncertaintyActive ? "neutral" : stampDutyUnresolved ? "warning" : dutySaving > 0 ? "positive" : "neutral",
    eligibilityState: eligibility,
    microVisual: {
      kind: "progress",
      value: Math.min((dutySaving / Math.max(standardDuty, 1)) * 100, 100),
      label: "With vs without",
    },
    metrics: [
      {
        id: "stamp-duty-standard",
        label: dutyUncertaintyActive ? "Without scheme*" : "Without scheme",
        value: formatDutyCurrency(standardDuty, dutyUncertaintyActive),
      },
      {
        id: "stamp-duty-scheme",
        label: dutyUncertaintyActive ? "With scheme*" : "With scheme",
        value: formatDutyCurrency(schemeDuty, dutyUncertaintyActive),
      },
      {
        id: "stamp-duty-saving",
        label: dutyUncertaintyActive ? "Indicative saving*" : "Indicative saving",
        value: formatDutyCurrency(dutySaving, dutyUncertaintyActive),
        tone: dutyUncertaintyActive ? "neutral" : dutySaving > 0 ? "positive" : "neutral",
      },
      {
        id: "stamp-duty-model-status",
        label: "Model status",
        value: dutyUncertaintyActive
          ? "Broad assumption used*"
          : stampDutyUnresolved
            ? "Unresolved rule path matched"
            : "Resolved rule path matched",
        tone: dutyUncertaintyActive ? "neutral" : stampDutyUnresolved ? "warning" : "positive",
      },
      {
        id: "stamp-duty-source",
        label: "Verification source",
        value: stampDutySourceUrls[0] ? "Open official source" : "No source loaded",
        href: stampDutySourceUrls[0],
      },
      {
        id: "stamp-duty-link",
        label: "stamp duty",
        value: "Learn more",
        glossaryTerm: {
          term: "stamp duty",
          body: "A state tax that can materially change the upfront cash needed to settle a purchase.",
        },
      },
    ],
    statusChips: [
      HOME_STATE_LABELS[stateKey],
      eligibility.label,
      dutyUncertaintyActive ? "Broad assumption used*" : stampDutyUnresolved ? "External check required" : "Rules resolved",
      input.buyingArea === "state-capital" ? "Capital band" : "Regional band",
      ...(dutyIntake.needsTier2 && !dutyIntake.tier2Complete ? ["Advanced duty answers pending*"] : []),
    ],
    glossaryTerms: [
      {
        term: "stamp duty",
        body: "A state tax paid on many property transfers, usually before or at settlement.",
      },
    ],
    officialLinks: stateKey === "nsw" ? ["SERVICE_NSW_FHBAS", "REVENUE_NSW_FHOG"] : ["MONEYSMART_HOME"],
  };

  const depositPathway: HomeBuyingPathwayCard = {
    id: "deposit",
    label: "Deposit",
    headlineValue: formatCurrency(activeScenario.depositAmount),
    headlineStatus: currentLvr > 80 ? "warning" : "positive",
    eligibilityState: eligibility,
    microVisual: {
      kind: "progress",
      value: Math.min((activeScenario.depositPercent / 20) * 100, 100),
      label: "20% baseline",
    },
    metrics: [
      {
        id: "deposit-current",
        label: "Current deposit share",
        value: formatPercent(input.targetPropertyPrice === 0 ? 0 : (input.currentSavings / input.targetPropertyPrice) * 100),
      },
      {
        id: "deposit-time",
        label: "Time to save",
        value: `${activeScenario.timeToSaveMonths} months`,
      },
      {
        id: "deposit-repayment",
        label: "Indicative repayment",
        value: formatCurrency(activeScenario.indicativeRepayment),
      },
      {
        id: "deposit-payoff",
        label: "Estimated payoff time",
        value: `${activeScenario.estimatedPayoffYears} years`,
      },
      {
        id: "deposit-lvr",
        label: "LVR",
        value: formatPercent(currentLvr),
        tone: currentLvr > 80 ? "warning" : "neutral",
      },
      {
        id: "deposit-friction",
        label: "Rate friction",
        value: lvrFriction,
        glossaryTerm: {
          term: "rate friction",
          body: "Higher leverage can add cost or tighter servicing treatment, depending on lender policy.",
        },
      },
      {
        id: "deposit-fhss",
        label: "Super Saver",
        value: activeScenario.timeToSaveMonths > 12 ? "Worth comparing" : "Less urgent",
        glossaryTerm: {
          term: "Super Saver",
          body: "A broad concept showing how super-linked first-home savings rules may change the comparison view.",
        },
        href: REFERENCE_LINKS.FIRSTHOME_FHSS.href,
      },
    ],
    statusChips: [
      eligibility.label,
      lvrFriction,
      activeScenario.requiresLmi ? "LMI can apply" : "Lower upfront friction",
    ],
    glossaryTerms: [
      {
        term: "Super Saver",
        body: "A federal first-home concept linked to certain super contributions and release rules.",
      },
    ],
    officialLinks: ["FIRSTHOME_HOME_GUARANTEE", "FIRSTHOME_FHSS"],
    scenarioOptions,
  };

  const upfrontCostPathway: HomeBuyingPathwayCard = {
    id: "upfront-costs",
    label: "Additional Purchase Costs",
    headlineValue: formatCurrency(otherUpfrontCosts.mid),
    headlineStatus: "neutral",
    eligibilityState: {
      label: "NEEDS CHECK",
      tone: "neutral",
    },
    microVisual: {
      kind: "progress",
      value: 60,
      label: "Midpoint band",
    },
    metrics: [
      {
        id: "upfront-professional",
        label: "Solicitor/Conveyancer fees",
        value: formatCurrency(scaledSetupCosts.professionalFees),
      },
      {
        id: "upfront-disbursements",
        label: "Disbursements",
        value: formatCurrency(scaledSetupCosts.disbursements),
      },
      {
        id: "upfront-stamping",
        label: "Verification and admin",
        value: formatCurrency(scaledSetupCosts.stampingFee),
      },
      {
        id: "upfront-registration",
        label: "Registration fees",
        value: formatCurrency(scaledSetupCosts.registrationFees),
      },
      {
        id: "upfront-pexa",
        label: "PEXA fee",
        value: formatCurrency(scaledSetupCosts.pexaFee),
      },
      {
        id: "upfront-total",
        label: "Additional purchase costs",
        value: formatCurrency(otherUpfrontCosts.mid),
      },
    ],
    statusChips: [`NSW-guided estimate: ${scaledSetupCosts.label}`],
    glossaryTerms: [],
    officialLinks: ["MONEYSMART_HOME"],
  };

  const sourceKeys: ReferenceKey[] = [
    ...stampDutyPathway.officialLinks,
    ...depositPathway.officialLinks,
    ...upfrontCostPathway.officialLinks,
  ];

  return {
    heroSummary: [
      {
        label: "Cash outlay",
        value: formatCurrency(cashOutlayOverlay.totalBuyerCashOutlay),
      },
      {
        label: "Mortgage",
        value: formatCurrency(cashOutlayOverlay.mortgageAmount),
      },
      {
        label: "Duty impact",
        value: dutySaving > 0 ? formatDutyCurrency(dutySaving, dutyUncertaintyActive) : formatDutyCurrency(schemeDuty, dutyUncertaintyActive),
      },
    ],
    comparisonRibbon: [
      {
        id: "ribbon-income",
        label: "Income",
        value: incomeBand.label.toLowerCase(),
      },
      {
        id: "ribbon-savings",
        label: "Savings",
        value: savingsBand.label.toLowerCase(),
      },
      {
        id: "ribbon-costs",
        label: "Costs",
        value: expenseBand.label.toLowerCase(),
      },
      {
        id: "ribbon-age",
        label: "Age cohort",
        value: getAgeCohort(input.age),
        glossaryTerm: {
          term: "Age cohort",
          body: "A broad comparison band aligned to similar life-stage ranges, not a personal ranking.",
        },
      },
      {
        id: "ribbon-area",
        label: "Buying area",
        value: input.buyingArea === "state-capital" ? "state capital" : "regional / non-capital",
      },
      {
        id: "ribbon-state",
        label: "State",
        value: HOME_STATE_LABELS[input.homeState ?? "nsw"],
      },
    ],
    eligibility,
    dutyIntake,
    pathways: [stampDutyPathway, depositPathway, upfrontCostPathway],
    schemeStatuses: [
      {
        id: "stamp-duty",
        label: stampDutyMemory.label,
        state: dutyUncertaintyActive ? "neutral" : stampDutyUnresolved ? "watch" : dutySaving > 0 ? "active" : "inactive",
        detail: dutyUncertaintyActive
          ? dutyIntake.hasTier3EdgeCase
            ? `${formatDutyText("Broad assumption used for this duty path.", true)} ${dutyIntake.reasons.join(" ")}`
            : `${formatDutyText("Advanced duty answers are still needed for a tighter estimate.", true)} ${dutyIntake.reasons.join(" ")}`
          : stampDutyUnresolved
          ? `Model unresolved for this scenario. Verify with the official calculator. ${stampDutyMemory.areaNote}`
          : dutySaving > 0
            ? `${formatCurrency(dutySaving)} less duty in the ${HOME_STATE_LABELS[stateKey]} model. ${stampDutyMemory.areaNote}`
            : `No first-home duty reduction at this value in the ${HOME_STATE_LABELS[stateKey]} model. ${stampDutyMemory.areaNote}`,
        href: stampDutySourceUrls[0] ?? stampDutyMemory.href,
      },
      {
        id: "guarantee",
        label: "First Home Guarantee",
        state:
          activeScenario.id === "guarantee-5" && firstHomeGuaranteeAvailable
            ? "active"
            : firstHomeGuaranteeAvailable
              ? "available"
              : "inactive",
        detail: firstHomeGuaranteeAvailable
          ? `5% path stays within the broad ${formatCurrency(guaranteeCap)} band`
          : `Outside the broad ${formatCurrency(guaranteeCap)} band`,
        href: REFERENCE_LINKS.FIRSTHOME_HOME_GUARANTEE.href,
      },
      {
        id: "help-to-buy",
        label: "Help to Buy Scheme",
        state:
          activeScenario.id === "shared-equity-2" && helpToBuyAvailable
            ? "active"
            : helpToBuyAvailable
              ? "available"
              : "inactive",
        detail: helpToBuyAvailable
          ? `2% path stays within the broad ${formatCurrency(helpToBuyCap)} band`
          : HELP_TO_BUY_SUPPORTED_STATES[stateKey]
            ? `Outside the broad ${formatCurrency(helpToBuyCap)} band`
            : "Not currently active in this state in the broad tracker",
        href: REFERENCE_LINKS.TODO_HELP_TO_BUY.href,
      },
      {
        id: "fhss",
        label: "Super Saver Scheme",
        state: activeScenario.timeToSaveMonths > 12 ? "watch" : "inactive",
        detail:
          activeScenario.timeToSaveMonths > 12
            ? "Longer saving runway, so tax savings may be worth comparing"
            : "Shorter saving runway right now",
        href: REFERENCE_LINKS.FIRSTHOME_FHSS.href,
      },
    ],
    cashOutlayOverlay,
    sources: buildSources(sourceKeys),
    assumptions: [
      "Not financial advice - verify eligibility modelling with official sources.",
      `Stamp duty calculations use the source-dated rules engine model as at ${STAMP_DUTY_MODEL_DATE}.`,
      ...(stateKey === "act"
        ? [
            "ACT concession screening uses household prior-financial-year income with the 1 July 2024 threshold basis (base $250,000 with dependent-child increments).",
          ]
        : []),
      ...dutyIntake.reasons,
      dutyUncertaintyActive
        ? "Duty outputs remain on broad assumptions until Tier 2 is complete or the Tier 3 edge case is checked manually."
        : stampDutyUnresolved
          ? "One or more matched stamp-duty rules are unresolved and require direct official calculator verification."
          : "Matched stamp-duty rule paths are resolved in the current rules model.",
      "Capital-city and regional scheme comparisons use broad price bands for high-level screening only.",
      "Net income uses a simple resident tax scenario (including a broad 2% Medicare component) with no offsets, deductions, or levy exemptions.",
      "Mortgage comparisons use a 30-year principal-and-interest loan at 6.1%.",
      `Market-rate tiles use an educational owner-occupier estimate of ${CURRENT_MARKET_OWNER_OCCUPIER_RATE.toFixed(2)}% before any higher-LVR adjustment.`,
      "Private debt servicing uses a 5-year comparison term at 8.5%.",
      "Additional purchase costs use NSW-guided 2025/26 registration fees, FY26 PEXA pricing, and current conveyancer cost bands by property price.",
      `Benchmark comparisons are broad and reviewed on ${BENCHMARK_REVIEW_DATE}.`,
    ],
    reviewDate: HOMEOWNER_PATHWAY_REVIEW_DATE,
  };
}
