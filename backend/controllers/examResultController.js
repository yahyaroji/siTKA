// examResultController.js
import ExamResult from "../models/examResultModel.js";

export const getMyResult = async (req, res) => {
  try {
    // CEK DISINI: Apa isi req.user sebenarnya?
    // console.log("DEBUG REQ.USER:", req.user);

    // Jika di authController pakai user._id, maka di sini harus req.user._id
    // Jika di authController pakai { id: user._id }, maka di sini harus req.user.id
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        message: "Token valid, tapi ID tidak ditemukan dalam payload",
        payload: req.user,
      });
    }

    const results = await ExamResult.find({ user: userId }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
