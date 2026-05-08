const express = require("express");
const router = express.Router();

const redis = require("../services/redis");
const pool = require("../services/postgres");
const { generateOTP, hashOTP } = require("../utils/otp");
const { cleanPhone, validatePhone } = require("../utils/phone");
const messages = require("../config/messages");

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { svHash, value } = req.body;
  const phone = value;

  if (!phone) {
    return res.status(400).json({ msg: messages.MISSING_FIELD_PHONE });
  }

  const cleaned = cleanPhone(phone);
  if (!validatePhone(cleaned)) {
    return res.status(400).json({ msg: messages.INVALID_PHONE_FORMAT });
  }

  const existing = await redis.get(`otp:${cleaned}`);
  if (existing) {
    return res.status(400).json({ msg: messages.OTP_ALREADY_SENT });
  }

  const otp = generateOTP();
  const hashed = hashOTP(otp);

  const multi = redis.multi();
  multi.set(`otpHash:${hashed}`, cleaned, "EX", 300, "NX");
  multi.set(`otp:${cleaned}`, hashed, "EX", 300, "NX");
  await multi.exec();

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