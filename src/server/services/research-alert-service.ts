import { Resend } from "resend";
import { getResearchAlertRecipients } from "@/src/lib/admin";
import type { ResearchSubmissionRecord } from "@/src/lib/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

export async function sendResearchSubmissionAlert(submission: ResearchSubmissionRecord) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return false;
  }

  const recipients = getResearchAlertRecipients();
  if (recipients.length === 0) {
    return false;
  }

  const response = asRecord(submission.response);
  const result = asRecord(submission.result);
  const interviewEmail = asString(response.interviewEmail);
  const detailBand = asString(result.detailBand) ?? "unknown";
  const problemText = asString(response.problemText) ?? "No problem text supplied.";
  const attemptedSolutions = asString(response.attemptedSolutions) ?? "No attempted solutions supplied.";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const adminUrl = `${appUrl}/admin/research`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: recipients,
    subject: `New research response from ${submission.surface}`,
    text: [
      `A new research response was saved on ${submission.createdAt}.`,
      `Surface: ${submission.surface}`,
      `Interview opt-in: ${asBoolean(response.interviewOptIn) ? "Yes" : "No"}`,
      `Interview email: ${interviewEmail ?? "Not supplied"}`,
      `Detail band: ${detailBand}`,
      "",
      "Problem text:",
      problemText,
      "",
      "Attempted solutions:",
      attemptedSolutions,
      "",
      `Open admin view: ${adminUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">New research response</h2>
        <p><strong>Surface:</strong> ${submission.surface}</p>
        <p><strong>Interview opt-in:</strong> ${asBoolean(response.interviewOptIn) ? "Yes" : "No"}</p>
        <p><strong>Interview email:</strong> ${interviewEmail ?? "Not supplied"}</p>
        <p><strong>Detail band:</strong> ${detailBand}</p>
        <p><strong>Problem text:</strong><br />${problemText.replace(/\n/g, "<br />")}</p>
        <p><strong>Attempted solutions:</strong><br />${attemptedSolutions.replace(/\n/g, "<br />")}</p>
        <p><a href="${adminUrl}">Open the research admin view</a></p>
      </div>
    `,
  });

  return true;
}
