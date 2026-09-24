function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}

module.exports = errorHandler;