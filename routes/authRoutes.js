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
  googleLogin,
  metamaskLogin,
  metamaskNonce,
  metamaskProtected,
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
authRouter.post("/google-login", googleLogin);
authRouter.post("/metamask-login", metamaskLogin);
authRouter.get("/metamask-nonce", metamaskNonce); // number used once for metamask login
authRouter.get("/metamask-protected", metamaskProtected); // protected route for metamask login


export default authRouter;
