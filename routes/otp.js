const express = require("express");
const router = express.Router();

const redis = require("../services/redis");
const { generateOTP, hashOTP } = require("../utils/otp");

const { cleanPhone, validatePhone } = require("../utils/phone");


//Middleware: API key check
router.use((req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.API_KEY) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  next();
});


// Send OTP
router.post("/send-otp", async (req, res) => {
  // expect body to have svHash and value, where value is the phone number
  const { svHash, value } = req.body;
  const phone = value;

  //validate phone number presence
  if (!phone) {
    return res.status(400).json({ msg: "Missing field: phone number" });
  }

  //verify phone format
  const cleaned = cleanPhone(phone);
  if (!validatePhone(cleaned)) {
    return res.status(400).json({ msg: "Invalid phone number format" });
  }

  // check if OTP already exists for this phone number
  const existing = await redis.get(`otp:${cleaned}`);
  if (existing) {
    return res.status(400).json({ msg: "OTP already sent, please wait" });
  }

  //if not, generate OTP hash
  const otp = generateOTP();
  const hashed = hashOTP(otp);

  //Two redis sotre, one with hashed otp as key, other with phone as key, both with same value, the hash of otp, and same expiration time, atomic operation, if one fails, both fail, to ensure consistency, set nx to prevent overwriting existing OTPs, and set expiration to 5 minutes
  const multi = redis.multi();
  multi.set(`otp:${cleaned}`, hashed, "EX", 300, "NX");
  multi.set(`otpHash:${hashed}`, cleaned, "EX", 300, "NX");
  const results = await multi.exec();

  if (
  results === null ||
  results.some(result => result[0] !== null)
) {
  return res.status(500).json({
    msg: "Failed to store OTP"
  });
}
  // temp testing response, remove in production, only for development purposes
  //res.json({ success: true, message: "OTP created"}); include otp in message
  res.status(200).json({ msg: `OTP created: ${otp}` });
  //disabled for now, accessyou sms API calling, ip not yet added to whitelist
  /*
  try {
      await sendSMS(cleaned, otp);
      res.json({ success: true });
  } catch (err) {
      res.status(500).json({ error: "SMS failed" });
  }*/
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { svHash, value } = req.body;
  const otp = value;
  
  //validate otp presence
  if (!otp) {
    return res.status(400).json({ msg: "Missing field: OTP" });
  }
  //validate otp format, should be 6 digits
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ msg: "Invalid OTP format" });
  }

  //Hash the provided OTP and look up the phone number in Redis using the hashed OTP as the key
  const hashed = hashOTP(otp);
  const phone = await redis.get(`otpHash:${hashed}`);

  //If no phone number is found, the OTP is invalid or expired
  if (!phone) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  //Verified, delete the OTP from Redis to prevent reuse, and return success response
  //delete both keys to prevent reuse
  const multi = redis.multi();
  multi.del(`otp:${phone}`);
  multi.del(`otpHash:${hashed}`);
  await multi.exec();

  //status 200, allows customer to proceed with form submission, frontend can use this response to trigger the next step in the flow
  res.status(200).json({ msg: "OTP verified"});
});

module.exports = router;