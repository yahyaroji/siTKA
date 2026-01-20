import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ============================
// LOGIN (NIS + PASSWORD)
// ============================
export const loginUser = async (req, res) => {
  try {
    const { nis, password } = req.body;

    const user = await User.findOne({ nis });
    if (!user) {
      // Log ini penting untuk tahu jika banyak siswa salah ketik NIS
      console.log(`[AUTH] Login Gagal: ${nis} tidak ditemukan`);
      return res.status(400).json({ message: "NIS tidak ditemukan" });
    }
    //fitur untuk hashing pwd
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log ini membantu memastikan akunnya ada, tapi passwordnya salah
      console.log(`[AUTH] Password Salah: ${user.nama_lengkap} `);
      return res.status(400).json({ message: "Password salah" });
    }
    // Opsional: Log sukses untuk memantau trafik masuk di pm2 logs
    console.log(`[AUTH] Login Berhasil: ${user.nama_lengkap}`);

    // === GENERATE TOKEN ===
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user._id,
        nama_lengkap: user.nama_lengkap,
        nis: user.nis,
        sekolah_asal: user.sekolah_asal,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error LOGIN:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ============================
// GET PROFILE (PAKAI AUTH MIDDLEWARE)
// ============================
export const getUserProfile = async (req, res) => {
  try {
    const id = req.user.id; // diambil dari token authMiddleware

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error GET PROFILE:", err);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};
