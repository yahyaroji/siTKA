import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true,
      unique: true, // 1 session = 1 result
    },

    stage: {
      type: Number,
      required: true,
    },

    jawaban: {
      type: Object,
      required: true,
    },

    skor: {
      type: Number,
      required: true,
    },
    nilaiPerMapel: {
      bi: { type: Number, default: 0 },
      mtk: { type: Number, default: 0 },
    },
    detailPerMapel: {
      bi: { benar: Number, salah: Number },
      mtk: { benar: Number, salah: Number },
    },

    totalSoal: {
      type: Number,
      required: true,
    },

    benar: {
      type: Number,
      required: true,
    },

    salah: {
      type: Number,
      required: true,
    },

    selesaiAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ExamResult", examResultSchema);
