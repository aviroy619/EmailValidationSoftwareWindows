const axios = require("axios");
const env = require("../config/env");
const { getDb } = require("../config/db");
const { PLANS, normalizePlanKey, firstDayNextMonth } = require("./plans");

async function getPayPalAccessToken() {
  const tokenUrl = `${env.paypalApiBase}/v1/oauth2/token`;
  const resp = await axios.post(tokenUrl, "grant_type=client_credentials", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    auth: {
      username: env.paypalClientId,
      password: env.paypalClientSecret,
    },
  });
  return resp.data.access_token;
}

async function createSubscriptionApprovalUrl({ userId, email, planKey, returnUrl, cancelUrl }) {
  const plan = PLANS[normalizePlanKey(planKey)];
  if (!plan?.paypalPlanId) {
    throw new Error(`Missing PayPal plan ID for ${planKey}`);
  }

  const accessToken = await getPayPalAccessToken();
  const url = `${env.paypalApiBase}/v1/billing/subscriptions`;
  const payload = {
    plan_id: plan.paypalPlanId,
    custom_id: `${String(userId)}:${plan.key}`,
    application_context: {
      brand_name: "Email Validator",
      user_action: "SUBSCRIBE_NOW",
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  if (email) {
    payload.subscriber = { email_address: email };
  }

  const resp = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Prefer: "return=representation",
    },
  });

  const approveLink = (resp.data.links || []).find((link) => link.rel === "approve")?.href || "";
  if (!approveLink) {
    throw new Error("Missing PayPal approval link");
  }

  return { approvalUrl: approveLink, subscriptionId: resp.data.id, plan };
}

async function verifyWebhookSignature(reqBody, headers) {
  if (!env.paypalWebhookId || !env.paypalClientId || !env.paypalClientSecret) {
    return false;
  }
  const accessToken = await getPayPalAccessToken();
  const url = `${env.paypalApiBase}/v1/notifications/verify-webhook-signature`;
  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: env.paypalWebhookId,
    webhook_event: reqBody,
  };

  const resp = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return String(resp.data.verification_status || "").toUpperCase() === "SUCCESS";
}

function extractUserAndPlan(webhookPayload) {
  const resource = webhookPayload?.resource || {};
  const customId = resource?.custom_id || resource?.plan?.custom_id || "";
  const planRaw = resource?.plan_id || resource?.plan?.name || customId;
  const userId = customId.split(":")[0] || resource?.subscriber?.payer_id || "";
  const planKey = normalizePlanKey(planRaw);
  return { userId: String(userId), planKey, plan: PLANS[planKey] };
}

async function upsertSubscriptionFromWebhook(webhookPayload) {
  const db = getDb();
  const { userId, plan } = extractUserAndPlan(webhookPayload);
  if (!userId || !plan) {
    throw new Error("Unable to resolve userId/plan from webhook payload");
  }

  const subId = webhookPayload?.resource?.id || "";
  await db.collection("subscriptions").updateOne(
    { userId },
    {
      $set: {
        userId,
        paypalSubscriptionId: subId,
        planType: plan.planType,
        creditsPerMonth: plan.creditsPerMonth,
        currentCredits: plan.creditsPerMonth,
        status: "active",
        nextBillingDate: firstDayNextMonth(),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

async function logWebhook(payload, verified) {
  const db = getDb();
  await db.collection("paypal_webhooks").insertOne({
    eventType: payload?.event_type,
    payload,
    verified,
    createdAt: new Date(),
  });
}

module.exports = {
  createSubscriptionApprovalUrl,
  verifyWebhookSignature,
  upsertSubscriptionFromWebhook,
  logWebhook,
};
