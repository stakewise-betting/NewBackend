import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.id) {
            req.user = { id: decoded.id }; // Attach to req.user instead of req.body
            next();
        } else {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export default userAuth;
