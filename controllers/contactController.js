// controllers/contactController.js
// have  to implement admin function with fronend.now work only user function
import { validationResult } from "express-validator";
import Contact from "../models/contactModel.js";
import { sendEmail } from "../config/nodemailer.js";
import transporter from "../config/nodemailer.js";

// Submit a new contact form
export const submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullname, email, queryCategory, message } = req.body;

    // Create contact data object
    const contactData = {
      fullname,
      email,
      queryCategory,
      message,
    };

    // If user is logged in, associate contact with user
    if (req.user) {
      contactData.userId = req.user._id;
    }

    // Create a new contact entry
    const contact = await Contact.create(contactData);

    // Send confirmation email to user
    const mailOptionsUser = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Contact Request Received to STAKEWISE",
      text: `Dear ${fullname},\n\nThank you for contacting our support team. We have received your ${queryCategory} inquiry and will get back to you shortly.\n\nReference ID: ${contact._id}\n\nBest regards,\nStakewise Support Team`,
    };
    await transporter.sendMail(mailOptionsUser);

    // Send notification to support team
    const mailOptionsTeam = {
      from: process.env.SENDER_EMAIL,
      to: "stakewise02@gmail.com",
      subject: `New Support Request: ${queryCategory}`,
      text: `A new support request has been submitted:\n\nID: ${
        contact._id
      }\nName: ${fullname}\nEmail: ${email}\nCategory: ${queryCategory}\nMessage: ${message}\nUser ID: ${
        contactData.userId || "Guest user"
      }`,
    };
    await transporter.sendMail(mailOptionsTeam);

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};

// Get all contact forms (for admin)
export const getAllContacts = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering parameters
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.queryCategory = req.query.category;
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { fullname: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
        { message: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await Contact.countDocuments(filter);

    // Get contacts with pagination and filtering
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};

// Get a single contact by ID (for admin)
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate("userId", "name email") // Populate user details if associated
      .lean();

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};

// Update contact status (for admin)
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // If contact is resolved, send a notification to the user
    if (status === "resolved") {
      await sendEmail({
        to: contact.email,
        subject: "Your Support Request Has Been Resolved",
        text: `Dear ${contact.fullname},\n\nWe're pleased to inform you that your recent support request regarding "${contact.queryCategory}" has been resolved.\n\nIf you have any further questions or concerns, please feel free to contact us again.\n\nBest regards,\nBetwin Support Team`,
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error updating contact status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};

// Get user's own contact submissions (for logged-in users)
export const getUserContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching user contacts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};

// Add a reply to a contact (for admins)
export const addContactReply = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Send reply to the user via email
    await sendEmail({
      to: contact.email,
      subject: `RE: Your ${contact.queryCategory} Support Request`,
      text: `Dear ${contact.fullname},\n\nThank you for contacting our support team. Here is our response to your inquiry:\n\n${message}\n\nIf you have any further questions, please don't hesitate to contact us.\n\nBest regards,\nBetwin Support Team`,
    });

    // Update contact status to in-progress if it was new
    if (contact.status === "new") {
      contact.status = "in-progress";
      await contact.save();
    }

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};
