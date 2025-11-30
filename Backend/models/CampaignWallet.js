import mongoose from "mongoose";

const campaignWalletSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0, // Prevent negative balance
    },
    totalReceived: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    // Transaction history
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit", "refund"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        donationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Donation",
        },
        description: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Withdrawal requests
    withdrawalRequests: [
      {
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "processed"],
          default: "pending",
        },
        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Campaign owner
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        processedAt: {
          type: Date,
          default: null,
        },
        processedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Admin
        },
        rejectionReason: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to add funds (credit)
campaignWalletSchema.methods.addFunds = function (amount, donationId, description = "") {
  this.balance += amount;
  this.totalReceived += amount;
  this.transactions.push({
    type: "credit",
    amount,
    donationId,
    description,
    createdAt: new Date(),
  });
  return this.save();
};

// Method to withdraw funds (debit)
campaignWalletSchema.methods.withdrawFunds = function (amount, description = "") {
  if (this.balance < amount) {
    throw new Error("Insufficient balance");
  }
  this.balance -= amount;
  this.totalWithdrawn += amount;
  this.transactions.push({
    type: "debit",
    amount,
    description,
    createdAt: new Date(),
  });
  return this.save();
};

// Method to refund
campaignWalletSchema.methods.refund = function (amount, donationId, description = "") {
  if (this.balance < amount) {
    throw new Error("Insufficient balance for refund");
  }
  this.balance -= amount;
  this.transactions.push({
    type: "refund",
    amount,
    donationId,
    description,
    createdAt: new Date(),
  });
  return this.save();
};

export default mongoose.model("CampaignWallet", campaignWalletSchema);

