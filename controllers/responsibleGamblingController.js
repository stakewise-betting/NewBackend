// src/controllers/responsibleGamblingController.js

import responsibleGamblingService from "../services/responsibleGamblingService.js";

class ResponsibleGamblingController {

  async getDepositLimits(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const limits = await responsibleGamblingService.getDepositLimits(
        userId.toString()
      );
      return res.status(200).json({ success: true, data: limits });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async recordBet(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const { amount } = req.body;

      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid bet amount is required",
        });
      }

      await responsibleGamblingService.recordBet(
        userId.toString(),
        parseFloat(amount)
      );

      return res.status(200).json({
        success: true,
        message: "Bet recorded successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async setDepositLimits(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const limitData = req.body;

      // Validate request body
      if (
        (limitData.daily !== undefined &&
          (isNaN(limitData.daily) || limitData.daily < 0)) ||
        (limitData.weekly !== undefined &&
          (isNaN(limitData.weekly) || limitData.weekly < 0)) ||
        (limitData.monthly !== undefined &&
          (isNaN(limitData.monthly) || limitData.monthly < 0))
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Deposit limits must be valid numbers greater than or equal to zero",
        });
      }

      const updatedLimits = await responsibleGamblingService.setDepositLimits(
        userId.toString(),
        limitData
      );
      return res.status(200).json({
        success: true,
        message: "Deposit limits updated successfully",
        data: updatedLimits,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  getSelfAssessmentQuestions(req, res) {
    try {
      const questions = responsibleGamblingService.getSelfAssessmentQuestions();
      return res.status(200).json({ success: true, data: questions });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async submitSelfAssessment(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const { answers } = req.body;

      // Validate request body
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: "Answers must be provided as an array",
        });
      }

      const result = await responsibleGamblingService.submitSelfAssessment(
        userId.toString(),
        { answers }
      );
      return res.status(201).json({
        success: true,
        message: "Self-assessment submitted successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSelfAssessmentHistory(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const history = await responsibleGamblingService.getSelfAssessmentHistory(
        userId.toString()
      );
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new ResponsibleGamblingController();
