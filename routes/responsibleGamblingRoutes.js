// src/routes/responsibleGamblingRoutes.js

import express from 'express';
import responsibleGamblingController from '../controllers/responsibleGamblingController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(userAuth);

// Deposit limits routes
router.get('/deposit-limits', responsibleGamblingController.getDepositLimits);
router.post('/deposit-limits', responsibleGamblingController.setDepositLimits);
router.post('/record-bet', userAuth, responsibleGamblingController.recordBet);

// Self-assessment routes
router.get('/self-assessment/questions', responsibleGamblingController.getSelfAssessmentQuestions);
router.post('/self-assessment', responsibleGamblingController.submitSelfAssessment);
router.get('/self-assessment/history', responsibleGamblingController.getSelfAssessmentHistory);


export default router;