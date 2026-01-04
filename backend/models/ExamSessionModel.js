import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stage: {
    type: Number,
    required: true,
  },
  soalOrder: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
  ],
  startedAt: Date,
  expiresAt: Date,
  status: {
    type: String,
    enum: ["ongoing", "finished"],
    default: "ongoing",
  },
});

export default mongoose.model("ExamSession", examSessionSchema);
