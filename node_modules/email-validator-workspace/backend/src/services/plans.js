const PLANS = {
  starter: { planType: "Starter", creditsPerMonth: 500, monthlyPrice: 14.99 },
  professional: { planType: "Professional", creditsPerMonth: 2000, monthlyPrice: 49.99 },
  enterprise: { planType: "Enterprise", creditsPerMonth: 5000, monthlyPrice: 99.99 },
};

function normalizePlanKey(input = "") {
  const clean = String(input).trim().toLowerCase();
  if (clean.includes("starter")) return "starter";
  if (clean.includes("professional")) return "professional";
  if (clean.includes("enterprise")) return "enterprise";
  return "starter";
}

function firstDayNextMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

module.exports = { PLANS, normalizePlanKey, firstDayNextMonth };
