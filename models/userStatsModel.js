import mongoose from "mongoose";

const userStatsSchema = new mongoose.Schema(
  {
    userAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalLoss: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    totalBetsPlaced: {
      type: Number,
      default: 0,
    },
    totalAmountWagered: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient leaderboard queries
userStatsSchema.index({ netProfit: -1 });
userStatsSchema.index({ totalEarned: -1 });
userStatsSchema.index({ winRate: -1 });
userStatsSchema.index({ rank: 1 });

const UserStatsModel = mongoose.models.UserStats || mongoose.model("UserStats", userStatsSchema);

export default UserStatsModel;
