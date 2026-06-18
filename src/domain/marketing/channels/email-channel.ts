import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendCampaignEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ externalId?: string }> {
  if (!resend || !process.env.EMAIL_FROM) {
    console.log("[Campaign Email]", params.to, params.subject);
    return { externalId: `dev-${Date.now()}` };
  }

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return { externalId: result.data?.id };
}
