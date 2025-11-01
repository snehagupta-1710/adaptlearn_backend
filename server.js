import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import progressRoutes from "./routes/progressRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

dotenv.config();

const app = express();

// ✅ Proper CORS setup (local + Netlify frontend)
const corsOptions = {
  origin: [
    "http://127.0.0.1:3000",                  // for local development
    "https://adaptlearn-frontend.netlify.app" // your deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ Disable caching (optional, but helps prevent stale responses)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ✅ Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/quiz", quizRoutes);

// ✅ Default route for testing
app.get("/", (req, res) => {
  res.send("AdaptLearn Backend is running ✅");
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
