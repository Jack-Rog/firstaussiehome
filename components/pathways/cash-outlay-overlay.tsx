"use client";

import type { CashOutlayOverlayModel } from "@/src/lib/types";
import { formatCurrency } from "@/src/lib/utils";

export function CashOutlayOverlay({
  open,
  model,
  onClose,
}: {
  open: boolean;
  model: CashOutlayOverlayModel;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const rows = [
    { label: "Purchase price", value: model.purchasePrice },
    { label: "Deposit", value: model.depositAmount },
    { label: "Mortgage", value: model.mortgageAmount },
    { label: "Stamp duty", value: model.stampDuty },
    { label: "Other costs", value: model.otherUpfrontCosts },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Close cash outlay overlay"
        className="fixed inset-0 z-30 bg-black/25"
        onClick={onClose}
      />
      <aside
        data-testid="cash-outlay-overlay"
        className="fixed inset-x-3 bottom-16 z-40 mx-auto max-w-md rounded-[1.75rem] border border-border bg-white p-5 shadow-2xl md:inset-y-6 md:right-6 md:left-auto md:w-[24rem] md:max-w-none md:bottom-auto"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-primary-strong">Cash outlay</p>
          <button type="button" className="text-sm font-semibold text-foreground-soft" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              data-testid={`cash-row-${row.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center justify-between rounded-3xl border border-border bg-surface p-4"
            >
              <span className="text-sm text-foreground-soft">{row.label}</span>
              <span className="text-sm font-semibold">{formatCurrency(row.value)}</span>
            </div>
          ))}
          <div data-testid="cash-total" className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary-strong">Buyer cash outlay</span>
              <span className="text-lg font-semibold text-primary-strong">
                {formatCurrency(model.totalBuyerCashOutlay)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-foreground-soft">
              <span>Financed</span>
              <span>{formatCurrency(model.financedAmount)}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
