// src/models/responsibleGamblingModels.js
import mongoose from "mongoose";

// DEPOSIT LIMIT MODEL
const depositLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    daily: {
      type: Number,
      min: 0,
      default: null,
    },
    weekly: {
      type: Number,
      min: 0,
      default: null,
    },
    monthly: {
      type: Number,
      min: 0,
      default: null,
    },
    dailyUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklyUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Add last reset dates to track when to reset counters
    dailyResetDate: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
      },
    },
    weeklyResetDate: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        // Set to the start of the current week (Sunday)
        now.setDate(now.getDate() - now.getDay());
        return now;
      },
    },
    monthlyResetDate: {
      type: Date,
      default: () => {
        const now = new Date();
        // Set to the start of the current month
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now;
      },
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    // Rest of your schema...
  },
  { timestamps: true }
);

// SELF-ASSESSMENT QUESTION MODEL
const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
      unique: true,
    },
    text: {
      type: String,
      required: true,
    },
    options: [
      {
        value: String,
        label: String,
        score: Number,
      },
    ],
    category: {
      type: String,
      enum: ["financial", "behavioral", "emotional", "social"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const selfAssessmentQuestionnaireSchema = new mongoose.Schema({
  questions: [questionSchema],
  version: {
    type: Number,
    default: 1,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// SELF-ASSESSMENT RESULT MODEL
const selfAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    answers: [
      {
        questionId: {
          type: Number,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    recommendations: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const DepositLimit =
  mongoose.models.depositLimit ||
  mongoose.model("depositLimit", depositLimitSchema);
const SelfAssessmentQuestionnaire =
  mongoose.models.selfAssessmentQuestionnaire ||
  mongoose.model(
    "selfAssessmentQuestionnaire",
    selfAssessmentQuestionnaireSchema
  );
const SelfAssessment =
  mongoose.models.selfAssessment ||
  mongoose.model("selfAssessment", selfAssessmentSchema);

export { DepositLimit, SelfAssessmentQuestionnaire, SelfAssessment };
