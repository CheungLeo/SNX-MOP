const express = require("express");
const router = express.Router();

const redis = require("../services/redis");
const pool = require("../services/postgres");
const { generateOTP, hashOTP } = require("../utils/otp");
const { cleanPhone, validatePhone } = require("../utils/phone");
const messages = require("../config/messages");
const { sendAccessYouOTP } = require("../services/accessyou");

const normalizePhone = (phone) => {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (/^852\d{8}$/.test(digits)) return digits;
  if (/^\d{8}$/.test(digits)) return `852${digits}`;
  return null;
};

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { svHash, value } = req.body;
  const phone = value;

  if (!phone) {
    return res.status(400).json({ msg: messages.MISSING_FIELD_PHONE });
  }

  const normalized_phone = normalizePhone(phone);
  if (!normalized_phone || !validatePhone(normalized_phone)) {
    return res.status(400).json({ msg: messages.INVALID_PHONE_FORMAT });
  }

  const existing = await redis.get(`otp:${normalized_phone}`);
  if (existing) {
    return res.status(400).json({ msg: messages.OTP_ALREADY_SENT });
  }

  const otp = generateOTP();
  const hashed = hashOTP(otp);

  const multi = redis.multi();
  multi.set(`otpHash:${hashed}`, normalized_phone, "EX", 300, "NX");
  multi.set(`otp:${normalized_phone}`, hashed, "EX", 300, "NX");
  await multi.exec();

  const smsResult =
  await sendAccessYouOTP(
    normalized_phone,
    otp
  );

  console.log("Accessyou result:", smsResult); //DEBUG

  if (!smsResult.success) {

    console.error("SMS failed:", smsResult);
    // Clean up OTP from Redis if SMS sending failed
    await redis.del(`otpHash:${hashed}`);
    await redis.del(`otp:${normalized_phone}`);

    return res.status(500).json({
      msg: "Failed to send SMS",
      accessyou: smsResult
    });
  }

  res.status(200).json({ msg: messages.OTP_CREATED(otp) });
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { svHash, value } = req.body;
  const otp = value;

  if (!otp) {
    return res.status(400).json({ msg: messages.MISSING_FIELD_OTP });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ msg: messages.INVALID_OTP_FORMAT });
  }

  const hashed = hashOTP(otp);
  const phone = await redis.get(`otpHash:${hashed}`);

  if (!phone) {
    return res.status(400).json({ msg: messages.INVALID_OR_EXPIRED_OTP });
  }

  const phoneHash = hashOTP(phone);

  const verifiedCheck = await pool.query(
    "SELECT id FROM verified_phone_numbers WHERE phone_hash = $1",
    [phoneHash]
  );
  if (verifiedCheck.rows.length > 0) {
    return res.status(400).json({ msg: messages.PHONE_ALREADY_VERIFIED });
  }

  const multi = redis.multi();
  multi.del(`otp:${phone}`);
  multi.del(`otpHash:${hashed}`);
  await multi.exec();

  try {
    await pool.query(
      "INSERT INTO verified_phone_numbers (phone_hash) VALUES ($1) ON CONFLICT (phone_hash) DO NOTHING",
      [phoneHash]
    );
  } catch (err) {
    console.error("Failed to insert verified phone:", err);
  }

  res.status(200).json({ msg: messages.OTP_VERIFIED });
});

module.exports = router;