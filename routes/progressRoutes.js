import express from "express";
import Progress from "../models/Progress.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ Middleware to verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains userId
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ✅ Enroll user in a course
router.post("/enroll", verifyToken, async (req, res) => {
  const { courseName } = req.body;
  const userId = req.user.userId;

  if (!courseName) {
    return res.status(400).json({ message: "Course name is required" });
  }

  try {
    let existingProgress = await Progress.findOne({ userId, courseName });
    
    // ✅ If already enrolled, just return existing progress instead of blocking
    if (existingProgress) {
      return res.status(200).json({
        message: "Already enrolled — returning existing course data",
        progress: existingProgress,
      });
    }

    // Otherwise, create new progress
    const newProgress = new Progress({
      userId,
      courseName,
      topicsCompleted: 0,
      totalTopics: 7,
      quizScores: [],
    });

    await newProgress.save();
    res.status(201).json({ message: "Enrolled successfully", progress: newProgress });
  } catch (error) {
    console.error("Enrollment Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch all enrolled courses for the user
router.get("/courses", verifyToken, async (req, res) => {
  const userId = req.user.userId || req.user.id;


  try {
    const progressList = await Progress.find({ userId });
    res.status(200).json(progressList);
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch topics for a specific course
// ✅ Get topic-wise progress for a course
router.get("/topics/:courseName", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const { courseName } = req.params;

    console.log("📩 Fetching topics for:", { userId, courseName });

    const progress = await Progress.findOne({ userId, courseName });
    console.log("📊 Found progress:", progress);

    if (!progress) {
      return res.status(404).json({ message: "Course not found" });
    }

   const topicsData = (progress.quizScores || []).map(q => ({
  topic: q.topic,
  scorePercentage: q.score ? Math.round((q.score / 10) * 100) : 0,
}));
res.json(topicsData);

  } catch (err) {
    console.error("❌ Progress Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Update progress after completing a topic or quiz
router.post("/update", verifyToken, async (req, res) => {
  const { courseName, topic, score } = req.body;
  const userId = req.user.userId || req.user.id;

  if (!courseName || !topic || score === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const progress = await Progress.findOne({ userId, courseName });
    if (!progress) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!progress.quizScores) progress.quizScores = [];

    // Check if this topic already exists
    const existingTopic = progress.quizScores.find((q) => q.topic === topic);

    if (existingTopic) {
      existingTopic.score = score; // update existing topic’s score
    } else {
      progress.quizScores.push({ topic, score }); // add new quiz record
    }

    // ✅ Recalculate topicsCompleted dynamically
    progress.topicsCompleted = progress.quizScores.length;

    await progress.save();

    res.json({
      message: "Progress updated successfully",
      progress,
    });
  } catch (error) {
    console.error("Update Progress Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Get overall progress summary (for homepage)
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const progressList = await Progress.find({ userId });

    if (!progressList || progressList.length === 0) {
      return res.json({
        enrollmentCount: 0,
        completedTopics: 0,
        overallProgress: 0,
      });
    }

    const enrollmentCount = progressList.length;
    const totalScore = progressList.reduce((sum, course) => {
      return sum + course.quizScores.reduce((s, q) => s + (q.score || 0), 0);
    }, 0);

    const totalPossible = progressList.reduce(
      (sum, course) => sum + course.quizScores.length * 10,
      0
    );

    const completedTopics = progressList.reduce(
      (sum, c) => sum + (c.quizScores.length || 0),
      0
    );

    const overallProgress =
      totalPossible > 0 ? ((totalScore / totalPossible) * 100).toFixed(2) : 0;

    res.json({
      enrollmentCount,
      completedTopics,
      overallProgress,
    });
  } catch (error) {
    console.error("Summary Fetch Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/user", verifyToken, async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");

  try {
    const userId = req.user.userId || req.user.id;
    const progressList = await Progress.find({ userId });

    if (!progressList || progressList.length === 0) {
      return res.json([]);
    }

    // always send consistent format
    const formatted = progressList.map(course => {
      const topics = (course.quizScores && course.quizScores.length > 0)
        ? course.quizScores.map(q => ({
            topic: q.topic,
            scorePercentage: q.score ? Math.round((q.score / 10) * 100) : 0,
          }))
        : []; // ensure empty array, not undefined

      const totalScore = course.quizScores.reduce((sum, q) => sum + (q.score || 0), 0);
      const totalPossible = course.quizScores.length * 10;
      const averagePercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

      return {
        courseName: course.courseName,
        topics,
        averagePercentage: averagePercentage.toFixed(2),
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Error fetching user progress:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

