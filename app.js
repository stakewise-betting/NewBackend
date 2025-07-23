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
import adminRoutes from './routes/adminRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
// import betsRoutes from './routes/betsRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import responsibleGamblingRoutes from './routes/responsibleGamblingRoutes.js';
import resultRoutes from "./routes/resultRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import raffleRoutes from "./routes/raffleRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";


const app = express();

// Middleware

app.use(express.json());

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173", // Keep for development
  "https://stakewise-7yto.onrender.com" // Your production frontend
]; 

// Debug CORS
console.log('🌐 Allowed origins:', allowedOrigins);
console.log('🌐 Frontend URL from env:', process.env.FRONTEND_URL);

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin','user-id'],
  optionsSuccessStatus: 200 // For legacy browser support
})); // Connecting frontend to backend
app.use(cookieParser()); // Parse cookies

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📍 ${req.method} ${req.url} from origin: ${req.get('origin')}`);
    console.log(`🍪 Request cookies:`, req.cookies);
    next();
});

// Debug endpoint to test cookie handling
app.get('/api/debug/cookies', (req, res) => {
    res.json({
        cookies: req.cookies,
        headers: req.headers,
        origin: req.get('origin'),
        userAgent: req.get('user-agent')
    });
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
app.use('/api/watchlist', watchlistRoutes);
// app.use('/api/bets', betsRoutes);

app.use('/api/contact', contactRoutes);
app.use('/api/responsible-gambling', responsibleGamblingRoutes);
app.use('/api/results',resultRoutes);
app.use('/api/news', newsRoutes);
app.use("/api/raffles", raffleRoutes);
app.use("/api", leaderboardRoutes);

export default app;

