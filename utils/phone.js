const normalizePhone = (phone) => {
  if (typeof phone !== "string") return null;

  // Check if phone matches any of the allowed formats
  const isValidFormat = /^\+852\d{8}$/.test(phone) || /^\d{8}$/.test(phone) || /^\d{4} \d{4}$/.test(phone) || /^852\d{8}$/.test(phone);
  if (!isValidFormat) return null;

  // Normalize to 852xxxxxxxx
  const digits = phone.replace(/\D/g, ""); // Remove non-digits
  if (digits.length === 8) return `852${digits}`;
  if (digits.length === 11 && digits.startsWith("852")) return digits;
  return null; // Should not reach here if format is valid
};

module.exports = { normalizePhone };