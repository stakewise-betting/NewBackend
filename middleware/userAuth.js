import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js"; // Import your User model

const userAuth = async (req, res, next) => {
  const isAuthCheckEndpoint = req.originalUrl === '/api/auth/isAuthenticated';
  const { token } = req.cookies;

  if (!token) {
    return isAuthCheckEndpoint 
      ? res.status(200).json({ success: false, isLoggedIn: false })
      : res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    
    // Fetch the FULL user document from DB
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Attach full user document to request
    req.user = user;
    next();
  } catch (error) {
    return isAuthCheckEndpoint
      ? res.status(200).json({ success: false, isLoggedIn: false })
      : res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default userAuth;