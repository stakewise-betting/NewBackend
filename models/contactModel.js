// File: models/contactModel.js
import mongoose from 'mongoose';

// Schema for contact
const contactSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    queryCategory: {
      type: String,
      required: true,
      enum: [
        'Account Issues',
        'Deposits & Withdrawals',
        'Betting Questions',
        'Bonuses & Promotions',
        'Technical Support',
        'Other',
      ],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Not required as guests can submit contact forms
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;