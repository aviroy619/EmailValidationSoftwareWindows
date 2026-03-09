function toObjectIdString(value) {
  return String(value || "").trim();
}

function parsePagination({ limit = 50, skip = 0 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeSkip = Math.max(Number(skip) || 0, 0);
  return { limit: safeLimit, skip: safeSkip };
}

module.exports = { toObjectIdString, parsePagination };
