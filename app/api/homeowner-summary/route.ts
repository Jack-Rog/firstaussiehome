import { NextResponse } from "next/server";
import { Resend } from "resend";
import { formatCurrency } from "@/src/lib/utils";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    account?: {
      name?: string;
      email?: string;
      story?: string;
    };
    withSchemes?: {
      cashOutlayOverlay?: {
        totalBuyerCashOutlay?: number;
        financedAmount?: number;
      };
    };
    withoutSchemes?: {
      cashOutlayOverlay?: {
        totalBuyerCashOutlay?: number;
      };
    };
  };

  const email = body.account?.email?.trim();
  const name = body.account?.name?.trim() || "there";
  const story = body.account?.story?.trim() || "No story shared.";
  const currentCash = body.withSchemes?.cashOutlayOverlay?.totalBuyerCashOutlay ?? 0;
  const financedAmount = body.withSchemes?.cashOutlayOverlay?.financedAmount ?? 0;
  const baselineCash = body.withoutSchemes?.cashOutlayOverlay?.totalBuyerCashOutlay ?? 0;
  const cashDelta = baselineCash - currentCash;

  const message = [
    `Hi ${name},`,
    "",
    "Your Aussies First Home summary is ready.",
    `Funds required from you now: ${formatCurrency(currentCash)}`,
    `Bank funding shown in the comparison: ${formatCurrency(financedAmount)}`,
    `20% baseline cash shown in the comparison: ${formatCurrency(baselineCash)}`,
    `Difference shown by using common scheme assumptions: ${formatCurrency(Math.max(cashDelta, 0))}`,
    "",
    `The story you shared: ${story}`,
    "",
    "This summary is factual education and modelling only. Check the linked official criteria before relying on a scheme.",
  ].join("\n");

  console.warn(`[homeowner-story] ${name} <${email ?? "unknown"}>: ${story}`);

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM && email) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Aussies First Home summary",
      text: message,
    });

    return NextResponse.json({ deliveryMode: "resend" });
  }

  console.warn(`[console-mailer] First-home summary for ${email ?? "unknown"}\n${message}`);
  return NextResponse.json({ deliveryMode: "console" });
}
