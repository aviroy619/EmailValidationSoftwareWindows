const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { authLimiter } = require("./middleware/rateLimit");

const authRoutes = require("./routes/authRoutes");
const validateRoutes = require("./routes/validateRoutes");
const userRoutes = require("./routes/userRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: env.corsOrigin.length ? env.corsOrigin : true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", at: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/validate", validateRoutes);
app.use("/api/user", userRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
