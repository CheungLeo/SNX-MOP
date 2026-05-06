const axios = require("axios");

async function sendSMS(phone, otp) {
  const url = "https://otp.accessyou-api.com/sendsms-otp.php";

  const params = {
    accountno: process.env.ACCESSYOU_ACCOUNT,
    user: process.env.ACCESSYOU_USER,
    pwd: process.env.ACCESSYOU_PWD,
    tid: process.env.ACCESSYOU_TID,
    a: otp,
    phone: phone,
  };

  const response = await axios.get(url, { params });
  return response.data;
}

module.exports = { sendSMS };