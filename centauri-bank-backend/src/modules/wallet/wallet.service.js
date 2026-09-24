const prisma = require("../../config/prisma");
const { generateReference } = require("../../utils/reference");

const MAX_AMOUNT = 1000000; // $1,000,000 — sane real-world upper bound,
                             // defined once, used everywhere it's needed

async function depositFunds({ userId, amount }) {
  if (amount <= 0 || amount <= 10) {
    const error = new Error("Deposit amount must be greater than zero");
    error.status = 400;
    throw error;
  }

  if (amount > MAX_AMOUNT) {
    const error = new Error(`Amount cannot exceed ${MAX_AMOUNT}`);
    error.status = 400;
    throw error;
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    const error = new Error("Wallet not found");
    error.status = 404;
    throw error;
  }

  const [updatedWallet, transaction] = await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        reference: generateReference(),
        type: "DEPOSIT",
        amount,
        description: "Deposit",
        wallet: { connect: { userId } },
      },
    }),
  ]);

  return { wallet: updatedWallet, transaction };
}

async function verifyRecipient({ accountNumber }) {
  const wallet = await prisma.wallet.findUnique({
    where: { accountNumber },
    select: {
      accountNumber: true,
      accountTier: true,
      user: {
        select: { name: true },
      },
    },
  });

  if (!wallet) {
    const error = new Error("Account not found");
    error.status = 404;
    throw error;
  }

  return {
    accountNumber: wallet.accountNumber,
    accountHolderName: wallet.user.name,
    accountTier: wallet.accountTier,
  };
}

async function transferFunds({ senderUserId, recipientAccountNumber, amount, description }) {
  if (amount <= 0) {
    const error = new Error("Transfer amount must be greater than zero");
    error.status = 400;
    throw error;
  }

  if (amount <= 10) {
    const error = new Error("Transfer amount cannot be less than ₦10");
    error.status = 400;
    throw error;
  }

  if (amount > MAX_AMOUNT) {
    const error = new Error(`Amount cannot exceed ${MAX_AMOUNT}`);
    error.status = 400;
    throw error;
  }

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: senderUserId } });
  if (!senderWallet) {
    const error = new Error("Sender wallet not found");
    error.status = 404;
    throw error;
  }

  const recipientWallet = await prisma.wallet.findUnique({
    where: { accountNumber: recipientAccountNumber },
  });
  if (!recipientWallet) {
    const error = new Error("Recipient account not found");
    error.status = 404;
    throw error;
  }

  if (senderWallet.id === recipientWallet.id) {
    const error = new Error("Cannot transfer to your own account");
    error.status = 400;
    throw error;
  }

  const reference = generateReference();

  const result = await prisma.$transaction(async (tx) => {
    const debitResult = await tx.wallet.updateMany({
      where: {
        id: senderWallet.id,
        balance: { gte: amount },
      },
      data: { balance: { decrement: amount } },
    });

    if (debitResult.count === 0) {
      const error = new Error("Insufficient funds");
      error.status = 400;
      throw error;
    }

    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: { balance: { increment: amount } },
    });

    await tx.transaction.create({
      data: {
        reference,
        type: "TRANSFER_OUT",
        amount,
        description: description || `Transfer to ${recipientWallet.accountNumber}`,
        wallet: { connect: { id: senderWallet.id } },
      },
    });

    await tx.transaction.create({
      data: {
        reference,
        type: "TRANSFER_IN",
        amount,
        description: description || `Transfer from ${senderWallet.accountNumber}`,
        wallet: { connect: { id: recipientWallet.id } },
      },
    });

    return { reference, amount };
  });

  return result;
}

// ⚠️ INTENTIONALLY VULNERABLE — this is Findings 2 & 3 in our vuln chain.
// See VULN_LOG.md. Do not "fix" this by accident while refactoring later.
async function expressTransferFunds({ senderUserId, recipientAccountNumber, amount, description }) {

  if (amount <= 0) {
    const error = new Error("Transfer amount must be greater than zero");
    error.status = 400;
    throw error;
  }

  if (amount > MAX_AMOUNT) {
    const error = new Error(`Amount cannot exceed ${MAX_AMOUNT}`);
    error.status = 400;
    throw error;
  }

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: senderUserId } });
  if (!senderWallet) {
    const error = new Error("Sender wallet not found");
    error.status = 404;
    throw error;
  }

  const recipientWallet = await prisma.wallet.findUnique({
    where: { accountNumber: recipientAccountNumber },
  });
  if (!recipientWallet) {
    const error = new Error("Recipient account not found");
    error.status = 404;
    throw error;
  }

  // VULNERABILITY (Finding 2): no check that senderWallet.accountTier === "PREMIUM"

  // VULNERABILITY (Finding 3): balance checked in JS, then written separately —
  // the exact gap transferFunds() was built to close, reintroduced here
  if (senderWallet.balance < amount) {
    const error = new Error("Insufficient funds");
    error.status = 400;
    throw error;
  }

  const reference = generateReference();

  await prisma.wallet.update({
    where: { id: senderWallet.id },
    data: { balance: { decrement: amount } },
  });

  await prisma.wallet.update({
    where: { id: recipientWallet.id },
    data: { balance: { increment: amount } },
  });

  await prisma.transaction.create({
    data: {
      reference,
      type: "TRANSFER_OUT",
      amount,
      description: description || `Express transfer to ${recipientWallet.accountNumber}`,
      wallet: { connect: { id: senderWallet.id } },
    },
  });

  await prisma.transaction.create({
    data: {
      reference,
      type: "TRANSFER_IN",
      amount,
      description: description || `Express transfer from ${senderWallet.accountNumber}`,
      wallet: { connect: { id: recipientWallet.id } },
    },
  });

  return { reference, amount, express: true };
}

// ⚠️ INTENTIONALLY VULNERABLE — Finding 5 (BFLA). See VULN_LOG.md.
// This should be admin-only, but the check only happens client-side
// (hidden from the UI), never verified here on the server.
async function adjustBalance({ accountNumber, newBalance, reason }) {
  const wallet = await prisma.wallet.findUnique({ where: { accountNumber } });

  if (!wallet) {
    const error = new Error("Account not found");
    error.status = 404;
    throw error;
  }

  const reference = generateReference();

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { accountNumber },
      data: { balance: newBalance },
    });

    await tx.transaction.create({
      data: {
        reference,
        type: "DEPOSIT", // reusing DEPOSIT type for simplicity; a real system would have its own ADJUSTMENT type
        amount: newBalance,
        description: `Admin balance adjustment: ${reason || "No reason provided"}`,
        wallet: { connect: { accountNumber } },
      },
    });

    return updatedWallet;
  });

  return result;
}

async function getTransactionHistory({ userId }) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    const error = new Error("Wallet not found");
    error.status = 404;
    throw error;
  }

  const transactions = await prisma.transaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 200, // limit to 200 transactions for performance
  });

  return transactions;
}
module.exports = { depositFunds, verifyRecipient, transferFunds, expressTransferFunds, adjustBalance, getTransactionHistory };