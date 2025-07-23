import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
  const isAuthCheckEndpoint = req.originalUrl === '/api/auth/isAuthenticated';
  const { token } = req.cookies;

  console.log(`🔐 Auth check for ${req.originalUrl}`);
  console.log(`🍪 Token exists:`, !!token);
  console.log(`🍪 All cookies:`, Object.keys(req.cookies));

  if (!token) {
    console.log(`❌ No token found for ${req.originalUrl}`);
    return isAuthCheckEndpoint 
      ? res.status(200).json({ success: false, isLoggedIn: false })
      : res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    console.log(`✅ Token valid for user ID:`, decoded.id);
    
    // Fetch the FULL user document from DB
    const user = await userModel.findById(decoded.id);
    if (!user) {
      console.log(`❌ User not found for ID:`, decoded.id);
      return res.status(401).json({ success: false, message: "User not found" });
    }

    console.log(`✅ User authenticated:`, user.email);
    // Attach full user document to request
    req.user = user;
    next();
  } catch (error) {
    console.log(`❌ Token validation failed:`, error.message);
    return isAuthCheckEndpoint
      ? res.status(200).json({ success: false, isLoggedIn: false })
      : res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default userAuth;