// src/services/responsibleGamblingService.js

import mongoose from "mongoose";
import {
  DepositLimit,
  TimeOut,
  SelfAssessment,
  SupportRequest,
} from "../models/responsibleGamblingModels.js";
import User from "../models/userModel.js";
import { selfAssessmentQuestions } from "../data/selfAssessmentQuestions.js";

class ResponsibleGamblingService {
  /**
   * Get deposit limits for a user
   */
  // src/services/responsibleGamblingService.js

// Function to get deposit limits with usage tracking
async getDepositLimits(userId) {
  try {
    let limits = await DepositLimit.findOne({ userId });

    // If no limits exist, create default ones
    if (!limits) {
      limits = await DepositLimit.create({
        userId: new mongoose.Types.ObjectId(userId),
        daily: 100,  // Default values
        weekly: 500,
        monthly: 2000
      });
    }

    // Check if we need to reset any counters
    const now = new Date();

    // Reset daily counter if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (limits.dailyResetDate < today) {
      limits.dailyUsed = 0;
      limits.dailyResetDate = today;
    }

    // Reset weekly counter if needed
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to Sunday
    if (limits.weeklyResetDate < startOfWeek) {
      limits.weeklyUsed = 0;
      limits.weeklyResetDate = startOfWeek;
    }

    // Reset monthly counter if needed
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    if (limits.monthlyResetDate < startOfMonth) {
      limits.monthlyUsed = 0;
      limits.monthlyResetDate = startOfMonth;
    }

    // Save any updates to reset counters
    if (limits.isModified()) {
      await limits.save();
    }

    // Return limits with calculated remaining values
    return {
      daily: {
        limit: limits.daily || 100,
        used: limits.dailyUsed || 0,
        remaining: Math.max(0, (limits.daily || 100) - (limits.dailyUsed || 0))
      },
      weekly: {
        limit: limits.weekly || 500,
        used: limits.weeklyUsed || 0,
        remaining: Math.max(0, (limits.weekly || 500) - (limits.weeklyUsed || 0))
      },
      monthly: {
        limit: limits.monthly || 2000,
        used: limits.monthlyUsed || 0,
        remaining: Math.max(0, (limits.monthly || 2000) - (limits.monthlyUsed || 0))
      }
    };
  } catch (error) {
    throw new Error(`Failed to get limits: ${error.message}`);
  }
}

// New function to record bet amounts
async recordBet(userId, betAmount) {
  try {
    const limits = await DepositLimit.findOne({ userId });
    
    if (!limits) {
      // If user doesn't have limits set, create default ones
      await DepositLimit.create({
        userId: new mongoose.Types.ObjectId(userId),
        daily: 100,
        weekly: 500,
        monthly: 2000,
        dailyUsed: betAmount,
        weeklyUsed: betAmount,
        monthlyUsed: betAmount
      });
      return;
    }

    // First check for resets
    const now = new Date();

    // Reset daily counter if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (limits.dailyResetDate < today) {
      limits.dailyUsed = betAmount;
      limits.dailyResetDate = today;
    } else {
      limits.dailyUsed += betAmount;
    }

    // Reset weekly counter if needed
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to Sunday
    if (limits.weeklyResetDate < startOfWeek) {
      limits.weeklyUsed = betAmount;
      limits.weeklyResetDate = startOfWeek;
    } else {
      limits.weeklyUsed += betAmount;
    }

    // Reset monthly counter if needed
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    if (limits.monthlyResetDate < startOfMonth) {
      limits.monthlyUsed = betAmount;
      limits.monthlyResetDate = startOfMonth;
    } else {
      limits.monthlyUsed += betAmount;
    }

    await limits.save();
  } catch (error) {
    throw new Error(`Failed to record bet: ${error.message}`);
  }
}
  /**
   * Set deposit limits for a user
   */
  async setDepositLimits(userId, limitData) {
    try {
      // Update only the dedicated deposit limits collection
      const updatedLimits = await DepositLimit.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          ...limitData,
          updatedAt: new Date(),
        },
        { new: true, upsert: true }
      );

      // Remove the user model update since we can't modify the schema

      return updatedLimits;
    } catch (error) {
      throw new Error(`Failed to set deposit limits: ${error.message}`);
    }
  }

  /**
   * Get active time-out for a user
   */
  async getActiveTimeOut(userId) {
    try {
      const timeOut = await TimeOut.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        status: "active",
        endDate: { $gt: new Date() },
      });

      // If no active time-out in dedicated collection, check user model
      if (!timeOut) {
        const user = await User.findById(userId);
        if (
          user &&
          user.responsibleGambling &&
          user.responsibleGambling.hasActiveTimeOut &&
          user.responsibleGambling.timeOutEndDate &&
          user.responsibleGambling.timeOutEndDate > new Date()
        ) {
          return {
            userId: user._id,
            startDate: null, // We might not have this in the user model
            endDate: user.responsibleGambling.timeOutEndDate,
            status: "active",
          };
        }
        return null;
      }

      return timeOut;
    } catch (error) {
      throw new Error(`Failed to get time-out: ${error.message}`);
    }
  }

  /**
   * Set a time-out period for a user
   */
  async setTimeOut(userId, timeOutData) {
    try {
      // First check if there's already an active time-out
      const existingTimeOut = await this.getActiveTimeOut(userId);
      if (existingTimeOut) {
        throw new Error("You already have an active time-out period");
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + timeOutData.duration);

      // Create new time-out in dedicated collection
      const timeOut = await TimeOut.create({
        userId: new mongoose.Types.ObjectId(userId),
        startDate,
        endDate,
        reason: timeOutData.reason || "",
        status: "active",
      });

      // Also update the user model for quick access
      await User.findByIdAndUpdate(
        userId,
        {
          "responsibleGambling.hasActiveTimeOut": true,
          "responsibleGambling.timeOutEndDate": endDate,
        },
        { new: true }
      );

      return timeOut;
    } catch (error) {
      throw new Error(`Failed to set time-out: ${error.message}`);
    }
  }

  /**
   * Cancel a time-out (admin function)
   */
  async cancelTimeOut(timeOutId, userId) {
    try {
      const timeOut = await TimeOut.findById(timeOutId);
      if (!timeOut) {
        throw new Error("Time-out not found");
      }

      timeOut.status = "cancelled";
      await timeOut.save();

      // Also update the user model
      await User.findByIdAndUpdate(
        userId,
        {
          "responsibleGambling.hasActiveTimeOut": false,
          "responsibleGambling.timeOutEndDate": null,
        },
        { new: true }
      );

      return timeOut;
    } catch (error) {
      throw new Error(`Failed to cancel time-out: ${error.message}`);
    }
  }

  /**
   * Submit a self-assessment and calculate risk score
   */
  async submitSelfAssessment(userId, assessmentData) {
    try {
      // Simple scoring algorithm for demonstration
      // Real implementation would have more sophisticated scoring logic
      let score = 0;

      assessmentData.answers.forEach((answer) => {
        const answerValue = [
          "Never",
          "Sometimes",
          "Often",
          "Almost always",
        ].indexOf(answer.answer);
        if (answerValue !== -1) {
          score += answerValue;
        }
      });

      // Determine risk level
      let risk = "low";
      if (score >= 10) {
        risk = "high";
      } else if (score >= 5) {
        risk = "medium";
      }

      // Save assessment results
      const assessment = await SelfAssessment.create({
        userId: new mongoose.Types.ObjectId(userId),
        answers: assessmentData.answers,
        score,
        risk,
      });

      return { assessment, questions: selfAssessmentQuestions };
    } catch (error) {
      throw new Error(`Failed to submit self-assessment: ${error.message}`);
    }
  }

  /**
   * Get self-assessment history for a user
   */
  async getSelfAssessmentHistory(userId) {
    try {
      const assessments = await SelfAssessment.find({
        userId: new mongoose.Types.ObjectId(userId),
      }).sort({ completedAt: -1 });

      return { assessments, questions: selfAssessmentQuestions };
    } catch (error) {
      throw new Error(
        `Failed to get self-assessment history: ${error.message}`
      );
    }
  }

  /**
   * Submit a support request to the responsible gambling team
   */
  async submitSupportRequest(userId, requestData) {
    try {
      const supportRequest = await SupportRequest.create({
        userId: new mongoose.Types.ObjectId(userId),
        name: requestData.name,
        email: requestData.email,
        message: requestData.message,
      });

      return supportRequest;
    } catch (error) {
      throw new Error(`Failed to submit support request: ${error.message}`);
    }
  }

  /**
   * Get all self-assessment questions
   */
  getSelfAssessmentQuestions() {
    return selfAssessmentQuestions;
  }
}

export default new ResponsibleGamblingService();
