const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");
const {generateAccountNumber} = require("../../utils/accountNumber");

const SALT_ROUNDS = 12;

async function registerUser({ email, password, name }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const error = new Error("Email already in use");
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      wallet: {
        create: {
          accountNumber: generateAccountNumber(),
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      // deliberately NOT selecting password — it should never
      // travel back out of this function at all
      wallet: {
        select: {
            accountNumber: true,
            accountTier: true,
            balance: true,
        },
      },
    },
  });

  return user;
}

// This function is used to log in a user and generate a JWT token

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately identical error for "no such user" and "wrong password".
  // If these differed, an attacker could send a bunch of emails and learn
  // which ones are registered just from the error message — a real,
  // commonly reported bug class called user enumeration.
  const invalidCredentialsError = () => {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  };

  if (!user) {
    invalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    invalidCredentialsError();
  }

  const token = jwt.sign(
    { userId: user.id },          // payload: what's embedded in the token
    process.env.JWT_SECRET,       // the secret we generated
    { expiresIn: "24h" }          // token becomes invalid after 24 hours
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

async function getCurrentUser({ userId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      wallet: {
        select: {
          accountNumber: true,
          accountTier: true,
          balance: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return user;
}
async function logoutUser() {
  // ⚠️ INTENTIONALLY INCOMPLETE — Finding 4 (JWT lifetime / no revocation).
  // A real logout would add the token to a server-side blocklist (or use
  // short-lived tokens + refresh tokens). This function does neither —
  // it exists, but the token it "logged out" remains fully valid until
  // it naturally expires (24h from issuance).
  return { message: "Logged out successfully" };
}
module.exports = { registerUser, loginUser, logoutUser, getCurrentUser };


