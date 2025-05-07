import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["bet", "win", "deposit", "withdrawal"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "event",
      sparse: true
    },
    betOption: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded"],
      default: "completed"
    }
  },
  { timestamps: true }
);

// Create compound indexes for efficient queries
transactionSchema.index({ userId: 1, type: 1, createdAt: 1 });
transactionSchema.index({ eventId: 1 });

const Transaction = mongoose.models.transaction || mongoose.model("transaction", transactionSchema);

export default Transaction;