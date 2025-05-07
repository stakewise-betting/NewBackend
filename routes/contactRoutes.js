// File: routes/contactRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { 
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContactStatus,
  getUserContacts,
  addContactReply
} from '../controllers/contactController.js';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Validation middleware
const contactValidation = [
  body('fullname')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('queryCategory')
    .isIn([
      'Account Issues',
      'Deposits & Withdrawals',
      'Betting Questions',
      'Bonuses & Promotions',
      'Technical Support',
      'Other',
    ])
    .withMessage('Please select a valid query category'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

// Public route - Submit contact form (doesn't require auth)
router.post('/', contactValidation, submitContactForm);

// User routes - Get user's own contact submissions
router.get('/my-contacts', userAuth, getUserContacts);

// Admin routes - Protected and restricted to admin role
router.get('/', userAuth, adminAuth, getAllContacts);
router.get('/:id', userAuth, adminAuth, getContactById);
router.patch('/:id/status', userAuth, adminAuth, updateContactStatus);
router.post('/:id/reply', userAuth, adminAuth, addContactReply);

export default router;