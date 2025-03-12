import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../config/emailTemplate.js";

import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// register controller
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all the fields" });
  }

  try {
    const existingUser = await userModel.findOne({ email }); //checking if the user already exists
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); //encrypting the password

    const user = new userModel({ name, email, password: hashedPassword }); //creating a new user
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    }); //creating a token for the user using user id. acts as a long-lived access token.

    res.cookie("token", token, {
      httpOnly: true, //cookie cannot be accessed by client side script
      secure: process.env.NODE_ENV === "production", //cookie works on https
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", //cross site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie will be removed after 7 days
    }); //setting the token in cookie

    //sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to STAKEWISE",
      text: `Hello ${name}, Welcome to STAKEWISE. We are glad to have you with us.`,
    };
    await transporter.sendMail(mailOptions);

    return res.status(201).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// login controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all the fields" });
  }

  try {
    const user = await userModel.findOne({ email }); //checking if the user exists
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password); //matching the password
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    }); //creating a token for the user using user id

    res.cookie("token", token, {
      httpOnly: true, //cookie cannot be accessed by client side script
      secure: process.env.NODE_ENV === "production", //cookie works on https
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", //cross site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie will be removed after 7 days
    }); //setting the token in cookie

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  const { token: googleToken } = req.body; // Renamed to avoid conflict

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const { sub, email, name, picture } = payload; // Extract user details

    // Check if user already exists in MongoDB
    let user = await userModel.findOne({ email });

    if (!user) {
      // Create new user in MongoDB if not exists
      user = new userModel({
        googleId: sub,
        email,
        name,
        picture,
        password: null, // No password required for Google auth
      });
      await user.save();
    }

    // Generate a JWT for session management
    const authToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    res.cookie("token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Cookie works on HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie will be removed after 7 days
    });

    res.json({ success: true, user, token: authToken });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ success: false, message: "Google login failed" });
  }
};

// logout controller
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true, //cookie cannot be accessed by client side script
      secure: process.env.NODE_ENV === "production", //cookie works on https
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", //cross site cookies
    }); //clearing the cookie

    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//send verification OTP to the user's email
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId); //finding the user by id
    if (user.isAccountVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Account already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); //generating a 6 digit OTP

    user.verifyOtp = otp; //setting the OTP
    user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; //OTP will expire in 10 minutes

    await user.save(); //saving the OTP in the database

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your OTP for account verification is ${otp}`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };

    await transporter.sendMail(mailOptions); //sending the OTP to the user's email

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify Email
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const user = await userModel.findById(userId); //finding the user by id
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" }); //checking if the user exists
    }

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" }); //checking if the OTP is valid
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" }); //checking if the OTP is expired
    }
    user.isAccountVerified = true; //verifying the account
    user.verifyOtp = ""; //clearing the OTP
    user.verifyOtpExpireAt = 0; //clearing the OTP expiry time

    await user.save(); //saving the user

    return res.status(200).json({ success: true, message: "Account verified" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//check if user is authenticated.
export const isAuthenticated = async (req, res) => {
  try {
    return res.status(200).json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//send reset password OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter your email" });
  }

  try {
    const user = await userModel.findOne({ email }); //finding the user by email
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" }); //checking if the user exists
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); //generating a 6 digit OTP

    user.resetOtp = otp; //setting the OTP
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; //OTP will expire in 15 minutes

    await user.save(); //saving the OTP in the database

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is ${otp}`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions); //sending the OTP to the user's email

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify reset password OTP
export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Please Enter OTP" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    return res.status(200).json({ success: true, message: "OTP verified" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//Reset user password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all the fields" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password Reset Successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
