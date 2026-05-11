const axios = require("axios");

async function sendAccessYouOTP(phone, otp) {

  const url =
    `https://otp.accessyou-api.com/sendsms-otp.php` +
    `?accountno=${encodeURIComponent(process.env.ACCESSYOU_ACCOUNTNO)}` +
    `&user=${encodeURIComponent(process.env.ACCESSYOU_USER)}` +
    `&pwd=${encodeURIComponent(process.env.ACCESSYOU_PWD)}` +
    `&tid=${encodeURIComponent(process.env.ACCESSYOU_TID)}` +
    `&a=${encodeURIComponent(otp)}` +
    `&phone=${encodeURIComponent(phone)}`;

  try {

    const response = await axios.get(url);

    console.log("Accessyou response:", response.data);

    const data = response.data;

    return {
      success: data.msg_status === "100",
      status: data.msg_status,
      statusDescription: data.msg_status_desc,
      messageId: data.msg_id,
      phone: data.phoneno,
      raw: data
    };

  } catch (err) {

    console.error("Accessyou error:", err);

    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  sendAccessYouOTP
};