const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../config/db");
const { signAuthToken, signEmailVerificationToken, verifyToken } = require("../utils/jwt");
const { getActiveSubscription } = require("../services/subscriptionService");
const { sendVerificationEmail } = require("../services/emailService");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, firstName = "", lastName = "" } = req.body || {};
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (cleanPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const db = getDb();
  const existingUser = await db.collection("users").findOne({ email: cleanEmail });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 10);
  const now = new Date();
  const insertResult = await db.collection("users").insertOne({
    email: cleanEmail,
    passwordHash,
    firstName: String(firstName || "").trim(),
    lastName: String(lastName || "").trim(),
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  const userId = String(insertResult.insertedId);
  const subscription = {
    userId,
    planType: "free",
    creditsPerMonth: 10,
    currentCredits: 10,
    status: "active",
    createdAt: now,
  };
  await db.collection("subscriptions").insertOne(subscription);

  const verificationToken = signEmailVerificationToken({ userId, email: cleanEmail });
  let verificationEmailSent = false;
  try {
    verificationEmailSent = await sendVerificationEmail(cleanEmail, verificationToken);
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
  }

  const token = signAuthToken({ userId, email: cleanEmail });
  return res.status(201).json({
    message: "Signup successful",
    verificationEmailSent,
    token,
    user: {
      _id: userId,
      email: cleanEmail,
      firstName: String(firstName || "").trim(),
      lastName: String(lastName || "").trim(),
      emailVerified: false,
    },
    subscription,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const db = getDb();
  const user = await db.collection("users").findOne({ email: String(email).toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash || "");
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signAuthToken({ userId: String(user._id), email: user.email });
  const subscription = await getActiveSubscription(String(user._id));

  return res.json({
    token,
    user: {
      _id: String(user._id),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    },
    subscription,
  });
});

router.post("/logout", async (_req, res) => {
  return res.json({ success: true });
});

router.get("/verify-email", async (req, res) => {
  const token = String(req.query.token || "");
  if (!token) {
    return res.status(400).send("Missing verification token");
  }

  try {
    const payload = verifyToken(token);
    if (payload?.type !== "email_verification" || !payload?.email) {
      return res.status(400).send("Invalid verification token");
    }

    const db = getDb();
    const email = String(payload.email).toLowerCase();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { emailVerified: true, updatedAt: new Date() } }
    );

    return res.status(200).send("Email verified successfully. You can now log in.");
  } catch (_) {
    return res.status(400).send("Invalid or expired verification token");
  }
});

router.get("/refresh", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = verifyToken(token);
    const newToken = signAuthToken({ userId: payload.userId, email: payload.email });
    const subscription = await getActiveSubscription(payload.userId);
    return res.json({ token: newToken, subscription });
  } catch (_) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
