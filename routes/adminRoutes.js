// Backend/NewBackend/routes/adminRoutes.js
import express from "express";
import {
    getUserCount,
    getAllUsers,
    deleteUser,
    changeUserRole 
} from "../controllers/adminController.js";
import authenticate from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js"; 

const router = express.Router();

router.get("/user-count", authenticate, adminAuth, getUserCount);

router.get("/users", authenticate, adminAuth, getAllUsers);
router.delete("/users/:userId", authenticate, adminAuth, deleteUser);
router.put("/users/:userId/role", authenticate, adminAuth, changeUserRole);

export default router;