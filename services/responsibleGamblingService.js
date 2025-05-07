// src/services/responsibleGamblingService.js

import mongoose from "mongoose";
import {
  DepositLimit,
  SelfAssessment,
} from "../models/responsibleGamblingModels.js";
import User from "../models/userModel.js";
import { selfAssessmentQuestions } from "../data/selfAssessmentQuestions.js";

class ResponsibleGamblingService {
  
  async getDepositLimits(userId) {
    try {
      let limits = await DepositLimit.findOne({ userId });

      // If no limits exist, create default ones
      if (!limits) {
        limits = await DepositLimit.create({
          userId: new mongoose.Types.ObjectId(userId),
          daily: 100, // Default values
          weekly: 500,
          monthly: 2000,
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
          remaining: Math.max(
            0,
            (limits.daily || 100) - (limits.dailyUsed || 0)
          ),
        },
        weekly: {
          limit: limits.weekly || 500,
          used: limits.weeklyUsed || 0,
          remaining: Math.max(
            0,
            (limits.weekly || 500) - (limits.weeklyUsed || 0)
          ),
        },
        monthly: {
          limit: limits.monthly || 2000,
          used: limits.monthlyUsed || 0,
          remaining: Math.max(
            0,
            (limits.monthly || 2000) - (limits.monthlyUsed || 0)
          ),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get limits: ${error.message}`);
    }
  }

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
          monthlyUsed: betAmount,
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

      return updatedLimits;
    } catch (error) {
      throw new Error(`Failed to set deposit limits: ${error.message}`);
    }
  }

  async submitSelfAssessment(userId, assessmentData) {
    try {
      // Step 1: Calculate scores for each answer
      const answersWithScores = assessmentData.answers.map((answer) => {
        const answerValue = ["Never", "Sometimes", "Often", "Almost always"].indexOf(answer.answer);
        if (answerValue === -1) {
          throw new Error(`Invalid answer value: ${answer.answer}`);
        }
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          score: answerValue, // Add the calculated score
        };
      });
  
      // Step 2: Calculate total score
      const totalScore = answersWithScores.reduce((sum, ans) => sum + ans.score, 0);
  
      // Step 3: Determine risk level
      let riskLevel = "low";
      if (totalScore >= 10) {
        riskLevel = "high";
      } else if (totalScore >= 5) {
        riskLevel = "medium";
      }
  
      // Step 4: Create the SelfAssessment document
      const assessment = await SelfAssessment.create({
        userId: new mongoose.Types.ObjectId(userId),
        answers: answersWithScores, // Now includes 'score' for each answer
        totalScore: totalScore,
        riskLevel: riskLevel,
      });
  
      return { assessment, questions: selfAssessmentQuestions }; // Adjust return as needed
    } catch (error) {
      throw new Error(`Failed to submit self-assessment: ${error.message}`);
    }
  }

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

  getSelfAssessmentQuestions() {
    return selfAssessmentQuestions;
  }
}

export default new ResponsibleGamblingService();
