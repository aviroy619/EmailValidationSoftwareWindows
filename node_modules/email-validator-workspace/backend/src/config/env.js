const dotenv = require("dotenv");
dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${Number(process.env.PORT || 5000)}`,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || "",
  paypalApiBase: process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com",
  paypalStarterPlanId: process.env.PAYPAL_STARTER_PLAN_ID || "",
  paypalProfessionalPlanId: process.env.PAYPAL_PROFESSIONAL_PLAN_ID || "",
  paypalEnterprisePlanId: process.env.PAYPAL_ENTERPRISE_PLAN_ID || "",
  websiteUrl: process.env.WEBSITE_URL || "http://emailnphonelist.com",
  gmailUser: process.env.GMAIL_USER || "",
  gmailPassword: process.env.GMAIL_PASSWORD || "",
  corsOrigin: (process.env.CORS_ORIGIN || "").split(",").map((v) => v.trim()).filter(Boolean),
};
