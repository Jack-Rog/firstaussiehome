import type { HomeownerPathwayInput } from "@/src/lib/types";

type AreaKey = NonNullable<HomeownerPathwayInput["buyingArea"]>;
type StateKey = NonNullable<HomeownerPathwayInput["homeState"]>;

type StateSchemeMemory = {
  stateLabel: string;
  stampDutySchemeLabel: string;
  stampDutyOfficialHref: string;
  stampDutyAreaNotes: Record<AreaKey, string>;
  regionalSensitivityNote: string;
};

export const STATE_SCHEME_MEMORY: Record<StateKey, StateSchemeMemory> = {
  nsw: {
    stateLabel: "NSW",
    stampDutySchemeLabel: "NSW First Home Buyers Assistance Scheme",
    stampDutyOfficialHref: "https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer",
    stampDutyAreaNotes: {
      "state-capital": "Sydney and metro purchases usually run into tighter value pressure earlier.",
      regional: "Regional NSW can still differ by property value profile, so duty outcomes should be rechecked before contract.",
    },
    regionalSensitivityNote: "NSW stamp duty outcomes can shift materially between metro and regional purchase values.",
  },
  vic: {
    stateLabel: "Victoria",
    stampDutySchemeLabel: "Victoria first home buyer duty exemption / concession",
    stampDutyOfficialHref: "https://www.sro.vic.gov.au/first-home-owner",
    stampDutyAreaNotes: {
      "state-capital": "Melbourne pricing can move buyers into concession bands faster than expected.",
      regional: "Regional VIC purchases may land in different duty outcomes versus metro due to value mix.",
    },
    regionalSensitivityNote: "Capital and regional values can create different duty outcomes in VIC.",
  },
  qld: {
    stateLabel: "Queensland",
    stampDutySchemeLabel: "Queensland first home transfer duty concession",
    stampDutyOfficialHref: "https://qro.qld.gov.au/duties/transfer-duty/concessions/homes/first-home/",
    stampDutyAreaNotes: {
      "state-capital": "SEQ capital-zone price points can change concession value quickly.",
      regional: "Regional QLD values can create a different concession profile than capital areas.",
    },
    regionalSensitivityNote: "QLD concession impacts should be checked with region context before decisions.",
  },
  wa: {
    stateLabel: "Western Australia",
    stampDutySchemeLabel: "WA first home owner rate of duty",
    stampDutyOfficialHref: "https://www.wa.gov.au/service/financial-management/taxation-and-duty-payments/first-home-owner-rate-duty",
    stampDutyAreaNotes: {
      "state-capital": "Perth metro prices can alter duty brackets faster than non-metro purchases.",
      regional: "Regional WA purchases can have different effective duty pressure because of price distribution.",
    },
    regionalSensitivityNote: "WA metro vs regional pricing can materially change transfer duty impact.",
  },
  sa: {
    stateLabel: "South Australia",
    stampDutySchemeLabel: "SA first home buyer relief",
    stampDutyOfficialHref: "https://www.revenuesa.sa.gov.au/stampduty/first-home-buyer-relief",
    stampDutyAreaNotes: {
      "state-capital": "Adelaide metro values can move buyers in and out of relief settings.",
      regional: "Regional SA properties may sit in different duty ranges compared with metro purchases.",
    },
    regionalSensitivityNote: "SA stamp duty checks should include whether the property is metro or regional.",
  },
  tas: {
    stateLabel: "Tasmania",
    stampDutySchemeLabel: "Tasmania property transfer duty guidance",
    stampDutyOfficialHref: "https://www.sro.tas.gov.au/property-transfer-duty",
    stampDutyAreaNotes: {
      "state-capital": "Hobart pricing movement can change transfer duty quickly for first-home buyers.",
      regional: "Regional TAS pricing can result in materially different duty outcomes.",
    },
    regionalSensitivityNote: "Tasmania duty implications vary meaningfully by location and value band.",
  },
  act: {
    stateLabel: "ACT",
    stampDutySchemeLabel: "ACT Home Buyer Concession Scheme",
    stampDutyOfficialHref: "https://www.revenue.act.gov.au/home-buyer-assistance/home-buyer-concession-scheme",
    stampDutyAreaNotes: {
      "state-capital": "ACT concession rules can still vary by household and value profile.",
      regional: "Where regional-style ACT edge purchases apply, eligibility should be checked directly.",
    },
    regionalSensitivityNote: "ACT concessions should be checked against current household and property settings.",
  },
  nt: {
    stateLabel: "NT",
    stampDutySchemeLabel: "NT Home Owner Assistance",
    stampDutyOfficialHref: "https://nt.gov.au/property/home-owner-assistance",
    stampDutyAreaNotes: {
      "state-capital": "Darwin-focused pricing can shift assistance outcomes.",
      regional: "Regional NT purchases can create different concession outcomes to metro-style purchases.",
    },
    regionalSensitivityNote: "NT support settings can differ by location and should be confirmed directly.",
  },
};

export function getStampDutyMemory(state: StateKey, area: AreaKey) {
  const memory = STATE_SCHEME_MEMORY[state];
  return {
    label: memory.stampDutySchemeLabel,
    href: memory.stampDutyOfficialHref,
    areaNote: memory.stampDutyAreaNotes[area],
    regionalSensitivityNote: memory.regionalSensitivityNote,
  };
}
