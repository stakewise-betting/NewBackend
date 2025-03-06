import express from "express";
import {
  login,
  logout,
  register,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  resetPassword,
  sendResetOtp,
  verifyResetOtp,
} from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/sendVerifyOtp", userAuth, sendVerifyOtp);
authRouter.post("/verifyEmail", userAuth, verifyEmail);
authRouter.get("/isAuthenticated", userAuth, isAuthenticated);
authRouter.post("/sendResetOtp", sendResetOtp);
authRouter.post("/resetPassword", resetPassword);
authRouter.post("/verifyResetOtp", verifyResetOtp);


export default authRouter;
