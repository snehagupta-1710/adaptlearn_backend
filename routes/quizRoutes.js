// routes/quizRoutes.js
import express from "express";
import Quiz from "../models/Quiz.js";
import Progress from "../models/Progress.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ Middleware to verify token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains userid and email
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ✅ Save quiz result and update progress
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { course, topic, score, total } = req.body;
    const userId = req.user.userid || req.user.userId;

    console.log("📩 Incoming quiz save request:", { course, topic, score, total, userId });

    if (!userId) {
      console.error("❌ No userId found in token.");
      return res.status(400).json({ message: "User ID missing from token" });
    }

    // Save quiz result
    const quiz = new Quiz({ userId, course, topic, score, total });
    await quiz.save();

    console.log("✅ Quiz saved in DB");

    // Update topic progress
  let progress = await Progress.findOne({ userId, courseName: course });

if (!progress) {
  // create progress if not found
  progress = new Progress({
    userId,
    courseName: course,
    topics: [{ topicName: topic, quizTaken: true, score }],
  });
} else {
  // update existing
  const topicObj = progress.topics.find((t) => t.topicName === topic);
  if (topicObj) {
    topicObj.quizTaken = true;
    topicObj.score = score;
  } else {
    progress.topics.push({ topicName: topic, quizTaken: true, score });
  }
}

await progress.save();
      

    res.json({ message: "Quiz saved successfully" });
  } catch (err) {
    console.error("🔥 Quiz Save Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get quiz history (optional)
router.get("/history", verifyToken, async (req, res) => {
  try {
   const userId = req.user.userid || req.user.userId;

    const quizzes = await Quiz.find({ userId });
    res.json(quizzes);
  } catch (err) {
    console.error("Quiz History Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;