const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAuthToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function signEmailVerificationToken(payload) {
  return jwt.sign({ ...payload, type: "email_verification" }, env.jwtSecret, { expiresIn: "1d" });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAuthToken, signEmailVerificationToken, verifyToken };
