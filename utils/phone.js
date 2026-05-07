function cleanPhone(phone) {
    return phone.replace(/^\+852/, "").replace(/[\s-]/g, "");
}

function validatePhone(cleaned) {
    return /^\d{8}$/.test(cleaned);
}

module.exports = { cleanPhone, validatePhone };