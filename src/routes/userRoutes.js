const express = require("express");
const { authRequired } = require("../middleware/auth");
const { getDb } = require("../config/db");
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
