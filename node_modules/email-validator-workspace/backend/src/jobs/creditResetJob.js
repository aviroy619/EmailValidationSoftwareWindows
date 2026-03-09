const cron = require("node-cron");
const { getDb } = require("../config/db");

function scheduleCreditResetJob() {
  cron.schedule("0 0 1 * *", async () => {
    const db = getDb();
    const now = new Date();
    const nextBillingDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    await db.collection("subscriptions").updateMany(
      { status: "active" },
      [
        {
          $set: {
            currentCredits: "$creditsPerMonth",
            creditResetDate: now,
            nextBillingDate,
            updatedAt: now,
          },
        },
      ]
    );
  });
}

module.exports = { scheduleCreditResetJob };
