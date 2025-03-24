import jwt from "jsonwebtoken";

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
      req.user = { id: decoded.id }; // set the user id in the request object
      next();
    } catch (error) {
      return isAuthCheckEndpoint
        ? res.status(200).json({ success: false, isLoggedIn: false })
        : res.status(401).json({ success: false, message: "Invalid token" });
    }
  };
  
export default userAuth;