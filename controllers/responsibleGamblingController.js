// src/controllers/responsibleGamblingController.js

import responsibleGamblingService from '../services/responsibleGamblingService.js';

class ResponsibleGamblingController {
  /**
   * Get deposit limits for the logged-in user
   */
  async getDepositLimits(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const limits = await responsibleGamblingService.getDepositLimits(userId.toString());
      return res.status(200).json({ success: true, data: limits });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // src/controllers/responsibleGamblingController.js
async recordBet(req, res) {
  try {
    const userId = req.user._id; // From userAuth middleware
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid bet amount is required'
      });
    }

    await responsibleGamblingService.recordBet(userId.toString(), parseFloat(amount));
    
    return res.status(200).json({
      success: true,
      message: 'Bet recorded successfully'
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
}

  /**
   * Set deposit limits for the logged-in user
   */
  async setDepositLimits(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const limitData = req.body;
      
      // Validate request body
      if (
        (limitData.daily !== undefined && (isNaN(limitData.daily) || limitData.daily < 0)) ||
        (limitData.weekly !== undefined && (isNaN(limitData.weekly) || limitData.weekly < 0)) ||
        (limitData.monthly !== undefined && (isNaN(limitData.monthly) || limitData.monthly < 0))
      ) {
        return res.status(400).json({
          success: false,
          message: 'Deposit limits must be valid numbers greater than or equal to zero'
        });
      }

      const updatedLimits = await responsibleGamblingService.setDepositLimits(userId.toString(), limitData);
      return res.status(200).json({
        success: true,
        message: 'Deposit limits updated successfully',
        data: updatedLimits
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get active time-out for the logged-in user
   */
  async getActiveTimeOut(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const timeOut = await responsibleGamblingService.getActiveTimeOut(userId.toString());
      return res.status(200).json({ success: true, data: timeOut });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Set a time-out period for the logged-in user
   */
  async setTimeOut(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const { duration, reason } = req.body;
      
      // Validate request body
      if (!duration || isNaN(duration) || duration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be a positive number of days'
        });
      }

      // Maximum time-out duration is 42 days (6 weeks)
      if (duration > 42) {
        return res.status(400).json({
          success: false,
          message: 'Maximum time-out duration is 42 days (6 weeks)'
        });
      }

      const timeOut = await responsibleGamblingService.setTimeOut(userId.toString(), { duration, reason });
      return res.status(201).json({
        success: true,
        message: 'Time-out set successfully',
        data: timeOut
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get self-assessment questions
   */
  getSelfAssessmentQuestions(req, res) {
    try {
      const questions = responsibleGamblingService.getSelfAssessmentQuestions();
      return res.status(200).json({ success: true, data: questions });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Submit a self-assessment
   */
  async submitSelfAssessment(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const { answers } = req.body;
      
      // Validate request body
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: 'Answers must be provided as an array'
        });
      }

      const result = await responsibleGamblingService.submitSelfAssessment(userId.toString(), { answers });
      return res.status(201).json({
        success: true,
        message: 'Self-assessment submitted successfully',
        data: result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get self-assessment history
   */
  async getSelfAssessmentHistory(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const history = await responsibleGamblingService.getSelfAssessmentHistory(userId.toString());
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Submit a support request to the responsible gambling team
   */
  async submitSupportRequest(req, res) {
    try {
      const userId = req.user._id; // From userAuth middleware
      const { name, email, message } = req.body;
      
      // Validate request body
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const supportRequest = await responsibleGamblingService.submitSupportRequest(userId.toString(), {
        name,
        email,
        message
      });

      return res.status(201).json({
        success: true,
        message: 'Support request submitted successfully',
        data: supportRequest
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new ResponsibleGamblingController();