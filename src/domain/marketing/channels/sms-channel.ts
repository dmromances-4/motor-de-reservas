export async function sendCampaignSms(params: {
  to: string;
  body: string;
}): Promise<{ externalId?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!sid || !token || !from) {
    console.log("[Campaign SMS]", params.to, params.body);
    return { externalId: `dev-sms-${Date.now()}` };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: params.to,
    From: from,
    Body: params.body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  const data = (await res.json()) as { sid: string };
  return { externalId: data.sid };
}
