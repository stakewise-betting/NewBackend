
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import commentRoutes from'./routes/commentRoutes.js'; 


const app = express();

// Middleware

app.use(express.json());
const allowedOrigins = ["http://localhost:5173"]; // frontend url
app.use(cors({ origin: allowedOrigins, credentials: true })); // connecting the frontend to the backend
app.use(cookieParser());

// API Endpoints (Routes)
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/comments", commentRoutes);

export default app;

