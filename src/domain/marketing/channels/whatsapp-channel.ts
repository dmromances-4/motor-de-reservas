export async function sendCampaignWhatsapp(params: {
  to: string;
  body: string;
}): Promise<{ externalId?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.log("[Campaign WhatsApp]", params.to, params.body);
    return { externalId: `dev-wa-${Date.now()}` };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const to = params.to.startsWith("whatsapp:") ? params.to : `whatsapp:${params.to}`;
  const body = new URLSearchParams({
    To: to,
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
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
