import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import commentRoutes from'./routes/commentRoutes.js'; 
import userUpdateRouter from "./routes/userUpdateRoutes.js";
import adminRoutes from './routes/adminRoutes.js'; // Adjust path
// ... other imports and app setup ...

 


const app = express();

// Middleware

app.use(express.json());

const allowedOrigins = ["http://localhost:5173"]; // frontend URL
app.use(cors({ origin: allowedOrigins, credentials: true })); // Connecting frontend to backend
app.use(cookieParser()); // Parse cookies

// Ensure COOP is applied after CORS
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

// API Endpoints (Routes)
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/comments", commentRoutes);
app.use("/api/user-update", userUpdateRouter);
app.use('/api/admin', adminRoutes);

export default app;

