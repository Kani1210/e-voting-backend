const crypto = require("crypto");

function convertIrisImageToCode(base64) {
  if (!base64) throw new Error("No iris data");

  const clean = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(clean, "base64");

  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ⚠️ MUST MATCH EXPORT NAME
module.exports = { convertIrisImageToCode };