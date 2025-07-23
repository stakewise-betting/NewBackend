// Backend/NewBackend/middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  
  next();
};

export default adminAuth;