import type { ReferenceKey } from "@/src/lib/types";

export type ReferenceLink = {
  key: ReferenceKey;
  label: string;
  href: string;
  note: string;
};

export const REFERENCE_LINKS: Record<ReferenceKey, ReferenceLink> = {
  MONEYSMART_HOME: {
    key: "MONEYSMART_HOME",
    label: "MoneySmart",
    href: "https://moneysmart.gov.au/",
    note: "Australian financial education and calculators.",
  },
  MONEYSMART_BUDGET: {
    key: "MONEYSMART_BUDGET",
    label: "MoneySmart budget planner",
    href: "https://moneysmart.gov.au/budgeting/budget-planner",
    note: "Budgeting concepts and planning prompts.",
  },
  MONEYSMART_SUPER: {
    key: "MONEYSMART_SUPER",
    label: "MoneySmart superannuation",
    href: "https://moneysmart.gov.au/how-super-works",
    note: "Introductory superannuation guidance.",
  },
  MONEYSMART_INVESTING: {
    key: "MONEYSMART_INVESTING",
    label: "MoneySmart investing",
    href: "https://moneysmart.gov.au/investing",
    note: "Investment education and risk explanations.",
  },
  ATO_HECS: {
    key: "ATO_HECS",
    label: "ATO study and training support loans",
    href: "https://www.ato.gov.au/individuals-and-families/study-and-training-support-loans",
    note: "Official HELP repayment thresholds and rules.",
  },
  ATO_PAYG: {
    key: "ATO_PAYG",
    label: "ATO PAYG withholding",
    href: "https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/payg-withholding",
    note: "PAYG withholding overview and employer guidance.",
  },
  ATO_TAX_RETURN: {
    key: "ATO_TAX_RETURN",
    label: "ATO lodge your tax return",
    href: "https://www.ato.gov.au/individuals-and-families/your-tax-return",
    note: "Tax return timing and record-keeping basics.",
  },
  SERVICE_NSW_FHBAS: {
    key: "SERVICE_NSW_FHBAS",
    label: "Revenue NSW First Home Buyers Assistance Scheme",
    href: "https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer",
    note: "Current NSW stamp duty relief criteria and thresholds.",
  },
  REVENUE_NSW_FHOG: {
    key: "REVENUE_NSW_FHOG",
    label: "Revenue NSW First Home Owner Grant",
    href: "https://www.revenue.nsw.gov.au/grants-schemes/first-home-owner-new-homes-grant",
    note: "NSW grant details for new homes.",
  },
  FIRSTHOME_HOME_GUARANTEE: {
    key: "FIRSTHOME_HOME_GUARANTEE",
    label: "Housing Australia Home Guarantee Scheme",
    href: "https://www.housingaustralia.gov.au/support-buy-home/home-guarantee-scheme",
    note: "Federal guarantee program information.",
  },
  FIRSTHOME_FHSS: {
    key: "FIRSTHOME_FHSS",
    label: "ATO First Home Super Saver Scheme",
    href: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/early-access-to-super/first-home-super-saver-scheme",
    note: "Official FHSS concept and release process.",
  },
  ASIC_FINANCIAL_ADVISERS_REGISTER: {
    key: "ASIC_FINANCIAL_ADVISERS_REGISTER",
    label: "ASIC Financial Advisers Register",
    href: "https://moneysmart.gov.au/financial-advice/financial-advisers-register",
    note: "Check licensing and adviser details.",
  },
  ASIC_MONEYSMART_SCAMS: {
    key: "ASIC_MONEYSMART_SCAMS",
    label: "MoneySmart scams and investing",
    href: "https://moneysmart.gov.au/consumer-rights-and-guarantees/scams",
    note: "Scam warning signs and what to do next.",
  },
  AFCA_HOME: {
    key: "AFCA_HOME",
    label: "AFCA",
    href: "https://www.afca.org.au/",
    note: "Complaint pathways and dispute resolution.",
  },
  NSW_GOV_SHARED_EQUITY: {
    key: "NSW_GOV_SHARED_EQUITY",
    label: "NSW shared equity concept note",
    href: "https://www.nsw.gov.au/housing-and-construction",
    note: "High-level NSW housing support references.",
  },
  TODO_HELP_TO_BUY: {
    key: "TODO_HELP_TO_BUY",
    label: "Housing Australia Help to Buy updates",
    href: "https://www.housingaustralia.gov.au/media/applications-now-open-australian-government-help-buy-scheme",
    note: "Official Housing Australia Help to Buy scheme update and launch detail.",
  },
};

export function getReferenceLinks(keys: ReferenceKey[]) {
  return keys.map((key) => REFERENCE_LINKS[key]);
}
