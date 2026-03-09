const express = require("express");
const { authRequired } = require("../middleware/auth");
const { validationLimiter } = require("../middleware/rateLimit");
const { validateEmailAddress } = require("../services/validationService");
const {
  computeCreditCost,
  ensureCredits,
  deductCreditsAndLog,
} = require("../services/subscriptionService");

const router = express.Router();

router.post("/email", authRequired, validationLimiter, async (req, res) => {
  const { email, enableSMTP = false } = req.body || {};
  const cost = computeCreditCost(enableSMTP);

  const creditCheck = await ensureCredits(req.auth.userId, cost);
  if (!creditCheck.ok) {
    return res.status(402).json({ message: creditCheck.reason, subscription: creditCheck.subscription });
  }

  const result = await validateEmailAddress(email, enableSMTP);
  const deduct = await deductCreditsAndLog({
    userId: req.auth.userId,
    email: result.email,
    isValid: result.isValid,
    reason: result.reason,
    enableSMTP,
    resultPayload: result,
  });

  if (!deduct.ok) {
    return res.status(402).json({ message: deduct.reason });
  }

  return res.json({ isValid: result.isValid, reason: result.reason, creditCost: deduct.cost, timeTakenMs: result.timeTakenMs });
});

router.post("/bulk", authRequired, validationLimiter, async (req, res) => {
  const { emails = [], enableSMTP = false } = req.body || {};
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: "emails must be a non-empty array" });
  }

  const unitCost = computeCreditCost(enableSMTP);
  const totalCost = unitCost * emails.length;
  const creditCheck = await ensureCredits(req.auth.userId, totalCost);
  if (!creditCheck.ok) {
    return res.status(402).json({ message: creditCheck.reason, requiredCredits: totalCost });
  }

  const results = [];
  for (const item of emails) {
    const result = await validateEmailAddress(item, enableSMTP);
    const deduct = await deductCreditsAndLog({
      userId: req.auth.userId,
      email: result.email,
      isValid: result.isValid,
      reason: result.reason,
      enableSMTP,
      resultPayload: result,
    });
    if (!deduct.ok) break;
    results.push({
      email: result.email,
      isValid: result.isValid,
      reason: result.reason,
      creditCost: deduct.cost,
      timeTakenMs: result.timeTakenMs,
    });
  }

  const creditsDeducted = results.reduce((sum, r) => sum + r.creditCost, 0);
  return res.json({ results, totalCost, creditsDeducted });
});

module.exports = router;
