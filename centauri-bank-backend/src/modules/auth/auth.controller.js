const authService = require("./auth.service");

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await authService.registerUser({ email, password, name });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.loginUser({ email, password });

    res.status(200).json({ message: "Login successful", ...result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logoutUser();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await authService.getCurrentUser({ userId });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}
module.exports = { register, login, logout, me };
