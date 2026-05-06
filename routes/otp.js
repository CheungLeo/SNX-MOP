const express = require("express");
const router = express.Router();

const redis = require("../services/redis");
const { generateOTP, hashOTP } = require("../utils/otp");


//Middleware: API key check
router.use((req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.API_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
});


// Send OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Missing field: phone number" });
  }

  const otp = generateOTP();
  const hashed = hashOTP(otp);

  await redis.set(`otp:${phone}`, hashed, "EX", 300);
  //REMOVE, test only
  console.log(otp, hashed);
  res.json({ success: true, message: "OTP created" });
  //disabled for now
  /*
  try {
    await sendSMS(phone, otp);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "SMS failed" });
  }*/
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  const stored = await redis.get(`otp:${phone}`);

  if (!stored) {
    return res.json({ success: false, message: "Expired or not found" });
  }

  if (stored === hashOTP(otp)) {
    await redis.del(`otp:${phone}`);
    return res.json({ success: true });
  }

  res.json({ success: false, message: "Invalid OTP" });
});

module.exports = router;