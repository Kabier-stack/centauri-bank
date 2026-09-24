function generateAccountNumber() {
  // 10-digit number, e.g. 4839201567
  // Deliberately NOT cryptographically random — real bank account
  // numbers are short and largely sequential/predictable by design,
  // which is exactly the realistic property we want for Finding 1
  // in our vuln chain (enumerable recipient lookup).
  const min = 1000000000;
  const max = 9999999999;
  return Math.floor(min + Math.random() * (max - min)).toString();
}

module.exports = { generateAccountNumber };