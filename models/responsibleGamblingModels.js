// src/models/responsibleGamblingModels.js
import mongoose from "mongoose";

// ============= DEPOSIT LIMIT MODEL =============
const depositLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true
    },
    daily: {
      type: Number,
      min: 0,
      default: null
    },
    weekly: {
      type: Number,
      min: 0,
      default: null
    },
    monthly: {
      type: Number,
      min: 0,
      default: null
    },
    // Add tracking fields for usage
    dailyUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    weeklyUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    // Add last reset dates to track when to reset counters
    dailyResetDate: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
      }
    },
    weeklyResetDate: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        // Set to the start of the current week (Sunday)
        now.setDate(now.getDate() - now.getDay());
        return now;
      }
    },
    monthlyResetDate: {
      type: Date,
      default: () => {
        const now = new Date();
        // Set to the start of the current month
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now;
      }
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    // Rest of your schema...
  },
  { timestamps: true }
);

// ============= TIME-OUT MODEL =============
const timeOutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // Duration in days
      required: true,
      min: 1,
      max: 42 // Maximum 42 days (6 weeks)
    },
    reason: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Create indexes for TimeOut model
timeOutSchema.index({ endDate: 1 });
timeOutSchema.index({ userId: 1, isActive: 1 });

// ============= SELF-ASSESSMENT QUESTION MODEL =============
const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
      unique: true
    },
    text: {
      type: String,
      required: true
    },
    options: [{
      value: String,
      label: String,
      score: Number
    }],
    category: {
      type: String,
      enum: ["financial", "behavioral", "emotional", "social"],
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  }, 
  { _id: false }
);

const selfAssessmentQuestionnaireSchema = new mongoose.Schema({
  questions: [questionSchema],
  version: {
    type: Number,
    default: 1
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// ============= SELF-ASSESSMENT RESULT MODEL =============
const selfAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    answers: [{
      questionId: {
        type: Number,
        required: true
      },
      answer: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true
      }
    }],
    totalScore: {
      type: Number,
      required: true
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true
    },
    recommendations: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// ============= SUPPORT REQUEST MODEL =============
const supportRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null
    },
    resolution: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// ============= CREATE AND EXPORT MODELS =============
const DepositLimit = mongoose.models.depositLimit || mongoose.model("depositLimit", depositLimitSchema);
const TimeOut = mongoose.models.timeOut || mongoose.model("timeOut", timeOutSchema);
const SelfAssessmentQuestionnaire = mongoose.models.selfAssessmentQuestionnaire || 
  mongoose.model("selfAssessmentQuestionnaire", selfAssessmentQuestionnaireSchema);
const SelfAssessment = mongoose.models.selfAssessment || mongoose.model("selfAssessment", selfAssessmentSchema);
const SupportRequest = mongoose.models.supportRequest || mongoose.model("supportRequest", supportRequestSchema);

export {
  DepositLimit,
  TimeOut,
  SelfAssessmentQuestionnaire,
  SelfAssessment,
  SupportRequest
};