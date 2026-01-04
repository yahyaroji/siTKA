import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nama_lengkap: { type: String, required: true },
  nis: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sekolah_asal: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ["siswa", "guru"] },
  // === TAMBAHAN BARU ===
  verifiedStage: {
    type: Number,
    default: 0,
    // artinya: default cuma boleh sampai stage 1
  },

  isVerifiedByAdmin: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("User", userSchema);
