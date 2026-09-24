function generateReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20260827
  const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 random chars
  return `CB-${date}-${random}`;
}

module.exports = { generateReference };