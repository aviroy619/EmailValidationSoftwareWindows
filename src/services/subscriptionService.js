const { getDb } = require("../config/db");
const { firstDayNextMonth } = require("./plans");

function computeCreditCost(enableSMTP) {
  return enableSMTP ? 1 : 0.5;
}

async function getActiveSubscription(userId) {
  const db = getDb();
  return db.collection("subscriptions").findOne({ userId: String(userId), status: "active" });
}

async function ensureCredits(userId, requiredCredits) {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return { ok: false, reason: "No active subscription" };
  if ((subscription.currentCredits || 0) < requiredCredits) {
    return { ok: false, reason: "Not enough credits", subscription };
  }
  return { ok: true, subscription };
}

async function deductCreditsAndLog({ userId, email, isValid, reason, enableSMTP, resultPayload }) {
  const db = getDb();
  const cost = computeCreditCost(enableSMTP);

  const subResult = await db.collection("subscriptions").findOneAndUpdate(
    { userId: String(userId), status: "active", currentCredits: { $gte: cost } },
    {
      $inc: { currentCredits: -cost },
      $set: { updatedAt: new Date() },
      $setOnInsert: { nextBillingDate: firstDayNextMonth() },
    },
    { returnDocument: "after" }
  );

  if (!subResult) {
    return { ok: false, reason: "Not enough credits or missing subscription" };
  }

  const validationDoc = {
    userId: String(userId),
    email,
    isValid,
    reason,
    creditCost: cost,
    enableSMTP: !!enableSMTP,
    payload: resultPayload,
    createdAt: new Date(),
  };
  await db.collection("validations").insertOne(validationDoc);

  await db.collection("transactions").insertOne({
    userId: String(userId),
    type: "validation",
    amount: -cost,
    email,
    metadata: { isValid, reason },
    createdAt: new Date(),
  });

  return { ok: true, subscription: subResult, cost };
}

module.exports = {
  computeCreditCost,
  getActiveSubscription,
  ensureCredits,
  deductCreditsAndLog,
};
