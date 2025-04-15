// middleware/checkUserActive.js
const checkUserActive = (req, res, next) => {
    const user = req.user; // user should be added in userAuth middleware
  
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    if (!user.isActivate) {
      return res.status(403).json({ message: "Your account is deactivated." });
    }
  
    next();
  };
  
  export default checkUserActive;
  