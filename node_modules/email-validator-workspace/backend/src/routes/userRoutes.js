const express = require("express");
const { authRequired } = require("../middleware/auth");
const { getDb } = require("../config/db");
const env = require("../config/env");
const { PLANS, normalizePlanKey } = require("../services/plans");
const { createSubscriptionApprovalUrl } = require("../services/paypalService");
const { parsePagination } = require("../utils/helpers");

const router = express.Router();

router.get("/subscription", authRequired, async (req, res) => {
  const db = getDb();
  const subscription = await db.collection("subscriptions").findOne({ userId: String(req.auth.userId) });
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  return res.json({
    userId: subscription.userId,
    planType: subscription.planType,
    creditsPerMonth: subscription.creditsPerMonth,
    currentCredits: subscription.currentCredits,
    nextBillingDate: subscription.nextBillingDate,
    status: subscription.status,
  });
});

router.get("/plans", authRequired, async (_req, res) => {
  return res.json({
    plans: Object.values(PLANS).map((plan) => ({
      key: plan.key,
      planType: plan.planType,
      creditsPerMonth: plan.creditsPerMonth,
      monthlyPrice: plan.monthlyPrice,
      available: Boolean(plan.paypalPlanId),
    })),
  });
});

router.post("/subscription/checkout", authRequired, async (req, res) => {
  const planKey = normalizePlanKey(req.body?.planKey || "");
  const plan = PLANS[planKey];
  if (!plan) {
    return res.status(400).json({ message: "Invalid plan" });
  }
  if (!plan.paypalPlanId) {
    return res.status(503).json({ message: "Plan is not configured for checkout" });
  }

  const db = getDb();
  const user = await db.collection("users").findOne({ _id: req.auth.userId });
  const safeBaseUrl = env.websiteUrl || env.apiBaseUrl;
  const returnUrl = `${safeBaseUrl}/billing/success?source=desktop&plan=${encodeURIComponent(planKey)}`;
  const cancelUrl = `${safeBaseUrl}/billing/cancel?source=desktop&plan=${encodeURIComponent(planKey)}`;

  const { approvalUrl } = await createSubscriptionApprovalUrl({
    userId: req.auth.userId,
    email: user?.email || "",
    planKey,
    returnUrl,
    cancelUrl,
  });

  return res.json({ approvalUrl });
});

router.get("/validations", authRequired, async (req, res) => {
  const db = getDb();
  const { limit, skip } = parsePagination(req.query || {});

  const [validations, total] = await Promise.all([
    db
      .collection("validations")
      .find({ userId: String(req.auth.userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("validations").countDocuments({ userId: String(req.auth.userId) }),
  ]);

  return res.json({ validations, total });
});

router.get("/transactions", authRequired, async (req, res) => {
  const db = getDb();
  const { limit, skip } = parsePagination(req.query || {});

  const [transactions, total] = await Promise.all([
    db
      .collection("transactions")
      .find({ userId: String(req.auth.userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("transactions").countDocuments({ userId: String(req.auth.userId) }),
  ]);

  return res.json({ transactions, total });
});

module.exports = router;
