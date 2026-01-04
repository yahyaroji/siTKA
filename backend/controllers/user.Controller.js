// import User from "../models/UserModel";
// import bcrypt from "bcrypt";
// import sendAccountEmail from "../middleware/mailer";

// // Get All Siswa (Hanya role siswa)
// export const getAllSiswa = async (req, res) => {
//   try {
//     const students = await User.find({ role: "siswa" }).sort({ nama_lengkap: 1 });
//     res.json(students);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Create / Add Manual
// // export const createSiswa = async (req, res) => {
// //   try {
// //     const { nis, password } = req.body;
// //     const existing = await User.findOne({ nis });
// //     if (existing) return res.status(400).json({ message: "NIS sudah terdaftar" });

// //     const hashedPassword = await bcrypt.hash(password, 10);
// //     const newSiswa = await User.create({
// //       ...req.body,
// //       password: hashedPassword,
// //       role: "siswa",
// //     });
// //     res.status(201).json(newSiswa);
// //   } catch (error) {
// //     res.status(400).json({ message: error.message });
// //   }
// // };

// // Create / Add Manual
// // export const createSiswa = async (req, res) => {
// //   console.log("1. Fungsi createSiswa terpanggil"); // <-- CEK INI
// //   try {
// //     const { nis, password, email } = req.body;

// //     const existing = await User.findOne({ nis });
// //     if (existing) return res.status(400).json({ message: "NIS sudah terdaftar" });

// //     console.log("2. Data divalidasi, mulai hashing..."); // <-- CEK INI
// //     const hashedPassword = await bcrypt.hash(password, 10);

// //     const newSiswa = await User.create({
// //       ...req.body,
// //       password: hashedPassword,
// //       role: "siswa",
// //     });
// //     console.log("3. User berhasil masuk DB:", newSiswa._id); // <-- CEK INI

// //     if (email) {
// //       console.log("4. Mencoba panggil mailer untuk:", email); // <-- CEK INI
// //       await sendAccountEmail(email, nis, password);
// //       console.log("5. Fungsi mailer selesai dijalankan"); // <-- CEK INI
// //     }

// //     res.status(201).json(newSiswa);
// //   } catch (error) {
// //     console.log("KODE ERROR:", error.message); // <-- CEK INI
// //     res.status(400).json({ message: error.message });
// //   }
// // };

// // Update Siswa
// export const updateSiswa = async (req, res) => {
//   try {
//     const { password, ...updateData } = req.body;

//     // Jika ganti password, hash ulang
//     if (password && password.trim() !== "") {
//       updateData.password = await bcrypt.hash(password, 10);
//     }

//     const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
//     res.json(updated);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // Delete Siswa
// export const deleteSiswa = async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id);
//     res.json({ message: "User berhasil dihapus" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Bulk Upload Excel (Upsert berdasarkan NIS)
// export const uploadSiswaExcel = async (req, res) => {
//   try {
//     const users = req.body; // Array of objects dari frontend
//     const defaultPassword = await bcrypt.hash("123456", 10);

//     const operations = users.map((u) => ({
//       updateOne: {
//         filter: { nis: String(u.nis) },
//         update: {
//           $setOnInsert: { password: defaultPassword, role: "siswa" },
//           $set: {
//             nama_lengkap: u.nama_lengkap,
//             sekolah_asal: u.sekolah_asal,
//             email: u.email,
//             verifiedStage: u.verifiedStage || 1,
//             isVerifiedByAdmin: u.isVerifiedByAdmin || false,
//           },
//         },
//         upsert: true,
//       },
//     }));

//     await User.bulkWrite(operations);
//     res.json({ message: "Berhasil memproses data Excel" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
