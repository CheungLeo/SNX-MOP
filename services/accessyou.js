const axios = require("axios");
const xml2js = require("xml2js");

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

    const parsed =
      await xml2js.parseStringPromise(response.data);

    const msg =
      parsed?.xml?.msg?.[0];

    const status =
      msg?.msg_status?.[0];

    const messageId =
      msg?.msg_id?.[0];

    return {
      success: status === "100",
      status,
      messageId,
      raw: parsed
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