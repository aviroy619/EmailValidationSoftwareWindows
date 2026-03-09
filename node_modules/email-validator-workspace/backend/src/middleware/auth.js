const { verifyToken } = require("../utils/jwt");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    req.auth = verifyToken(token);
    return next();
  } catch (_) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authRequired };
