import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  topicsCompleted: {
    type: Number,
    default: 0,
  },
  totalTopics: {
    type: Number,
    default: 7,
  },
  quizScores: [
    {
      topic: String,
      score: Number,
    },
  ],
});

export default mongoose.model("Progress", progressSchema);
