const env = require("../config/env");

const PLANS = {
  starter: {
    key: "starter",
    planType: "Starter",
    creditsPerMonth: 500,
    monthlyPrice: 14.99,
    paypalPlanId: env.paypalStarterPlanId,
  },
  professional: {
    key: "professional",
    planType: "Professional",
    creditsPerMonth: 2000,
    monthlyPrice: 49.99,
    paypalPlanId: env.paypalProfessionalPlanId,
  },
  enterprise: {
    key: "enterprise",
    planType: "Enterprise",
    creditsPerMonth: 5000,
    monthlyPrice: 99.99,
    paypalPlanId: env.paypalEnterprisePlanId,
  },
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
