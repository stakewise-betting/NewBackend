// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }
    
    next();
  };
  
  export default adminAuth;