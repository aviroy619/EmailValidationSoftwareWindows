const express = require("express");
const {
  verifyWebhookSignature,
  upsertSubscriptionFromWebhook,
  logWebhook,
} = require("../services/paypalService");

const router = express.Router();

router.post("/paypal", async (req, res) => {
  const event = req.body || {};
  const eventType = String(event.event_type || "");

  let verified = false;
  try {
    verified = await verifyWebhookSignature(event, req.headers);
  } catch (_) {
    verified = false;
  }

  await logWebhook(event, verified);

  if (!verified) {
    return res.status(400).json({ message: "Webhook signature verification failed" });
  }

  if (eventType === "BILLING.SUBSCRIPTION.CREATED" || eventType === "BILLING.SUBSCRIPTION.UPDATED") {
    await upsertSubscriptionFromWebhook(event);
  }

  return res.status(200).json({ ok: true });
});

module.exports = router;
