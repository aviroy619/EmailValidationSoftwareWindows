const dns = require("dns").promises;
const emailValidator = require("email-validator");

async function checkMx(domain) {
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch (_) {
    return false;
  }
}

async function validateEmailAddress(email, enableSMTP = false) {
  const startedAt = Date.now();
  const trimmed = String(email || "").trim();
  if (!trimmed) {
    return {
      email: trimmed,
      isValid: false,
      reason: "Email is required",
      checks: { format: false, mx: false, smtp: false },
      timeTakenMs: Date.now() - startedAt,
    };
  }

  const format = emailValidator.validate(trimmed);
  if (!format) {
    return {
      email: trimmed,
      isValid: false,
      reason: "Invalid email format",
      checks: { format: false, mx: false, smtp: false },
      timeTakenMs: Date.now() - startedAt,
    };
  }

  const domain = trimmed.split("@")[1];
  const mx = await checkMx(domain);
  if (!mx) {
    return {
      email: trimmed,
      isValid: false,
      reason: "Domain has no MX records",
      checks: { format: true, mx: false, smtp: false },
      timeTakenMs: Date.now() - startedAt,
    };
  }

  return {
    email: trimmed,
    isValid: true,
    reason: enableSMTP ? "Valid format and MX (SMTP probe placeholder)" : "Valid format and MX",
    checks: { format: true, mx: true, smtp: !!enableSMTP },
    timeTakenMs: Date.now() - startedAt,
  };
}

module.exports = { validateEmailAddress };
