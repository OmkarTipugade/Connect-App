/**
 * JWT payload always uses `userID` (see tokenGenerator.js).
 * Never fall back to `userId` — that field is not part of the token contract.
 */
const getTokenUserId = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const id = payload.userID;
  return typeof id === "string" && id.length > 0 ? id : null;
};

module.exports = { getTokenUserId };
