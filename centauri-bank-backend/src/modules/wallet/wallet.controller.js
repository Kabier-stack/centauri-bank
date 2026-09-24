const walletService = require("./wallet.service");

async function deposit(req, res, next) {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const result = await walletService.depositFunds({ userId, amount });

    res.status(200).json({
      message: "Deposit successful",
      wallet: result.wallet,
      transaction: result.transaction,
    });
  } catch (err) {
    next(err);
  }
}

async function verifyRecipient(req, res, next) {
  try {
    const { accountNumber } = req.query;

    if (!accountNumber) {
      return res.status(400).json({ error: "accountNumber is required" });
    }

    const result = await walletService.verifyRecipient({ accountNumber });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function transfer(req, res, next) {
  try {
    const senderUserId = req.user.userId;
    const { recipientAccountNumber, amount, description, expressTransfer } = req.body;

    if (!recipientAccountNumber || amount === undefined) {
      return res.status(400).json({ error: "recipientAccountNumber and amount are required" });
    }

   const result = expressTransfer
  ? await walletService.expressTransferFunds({ senderUserId, recipientAccountNumber, amount, description })
  : await walletService.transferFunds({ senderUserId, recipientAccountNumber, amount, description });
    
  res.status(200).json({ message: "Transfer successful", ...result });
  } catch (err) {
    next(err);
  }
}

async function adjustBalance(req, res, next) {
  try {
    const { accountNumber, newBalance, reason } = req.body;

    if (!accountNumber || newBalance === undefined) {
      return res.status(400).json({ error: "accountNumber and newBalance are required" });
    }

    const result = await walletService.adjustBalance({ accountNumber, newBalance, reason });

    res.status(200).json({ message: "Balance adjusted", wallet: result });
  } catch (err) {
    next(err);
  }
}

async function getTransactions(req, res, next) {
  try {
    const userId = req.user.userId;
    const transactions = await walletService.getTransactionHistory({ userId });
    res.status(200).json({ transactions });
  } catch (err) {
    next(err);
  }
}
module.exports = { deposit, verifyRecipient, transfer, adjustBalance, getTransactions };