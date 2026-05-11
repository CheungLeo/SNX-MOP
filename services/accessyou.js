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

    console.log("RAW RESPONSE:");
    console.log(response.data);

    // Accessyou may return plaintext debug/errors
    if (
      typeof response.data !== "string" ||
      !response.data.trim().startsWith("<")
    ) {
      return {
        success: false,
        error: "Non-XML response returned",
        raw: response.data
      };
    }

    const parsed =
      await xml2js.parseStringPromise(response.data);

    console.log("PARSED XML:");
    console.log(JSON.stringify(parsed, null, 2));

    const xml = parsed?.xml || {};

    const status =
      xml?.msg_status?.[0];

    const messageId =
      xml?.msg_id?.[0];

    const receiveStatus =
      xml?.receivestatus?.[0];

    return {
      success: status === "100",
      status,
      messageId,
      receiveStatus,
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