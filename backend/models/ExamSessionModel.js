import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
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
    // --- TAMBAHKAN FIELD INI ---
    answers: [
      {
        soalId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
        jawaban: mongoose.Schema.Types.Mixed,
        rasio: { type: Number, default: 0 }, // Simpan hasil hitungan (0 sampai 1)
        mapel: String, // Untuk filter dashboard guru nantinya
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("ExamSession", examSessionSchema);
