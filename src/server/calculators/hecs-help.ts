export function buildHecsHelpIllustration(annualIncome: number) {
  const thresholds = [
    { threshold: 54000, rate: 0 },
    { threshold: 67000, rate: 1 },
    { threshold: 80000, rate: 2.5 },
    { threshold: 95000, rate: 4.5 },
    { threshold: 110000, rate: 6 },
  ];

  const currentBand =
    [...thresholds].reverse().find((band) => annualIncome >= band.threshold) ?? thresholds[0];
  const annualIllustrativeRepayment = Math.round((annualIncome * currentBand.rate) / 100);

  return {
    reviewDate: "2026-03-03",
    annualIncome,
    currentBand,
    annualIllustrativeRepayment,
    chart: thresholds.map((band) => ({
      label: `$${band.threshold.toLocaleString("en-AU")}`,
      rate: band.rate,
    })),
    assumptions: [
      "This is an educational illustration only.",
      "Current thresholds can change each financial year.",
      "Employer withholding and final tax outcomes depend on wider circumstances.",
    ],
  };
}
