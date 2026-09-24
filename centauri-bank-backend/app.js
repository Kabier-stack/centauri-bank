const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/modules/auth/auth.routes");
const walletRoutes = require("./src/modules/wallet/wallet.routes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Centauri Bank API is running");
});

app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);

app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at ${PORT}`);
});