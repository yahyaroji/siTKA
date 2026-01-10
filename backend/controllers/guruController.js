import User from "../models/UserModel.js";
import ExamResult from "../models/examResultModel.js";
import bcrypt from "bcrypt";
import XLSX from "xlsx";
import sendAccountEmail from "../middleware/mailer.js";

//======HASIL SISWA======
// GET data semua siswa
export const getAllSiswa = async (req, res) => {
  try {
    if (req.user.role !== "guru") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const siswa = await User.find({ role: "siswa" }).select("-password");

    res.json(siswa);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil data siswa" });
  }
};

//verifikasi siswa
export const verifySiswa = async (req, res) => {
  const { stage, checked } = req.body;

  if (stage === undefined || checked === undefined) {
    return res.status(400).json({ message: "stage dan checked wajib" });
  }

  const siswa = await User.findById(req.params.id);
  if (!siswa) {
    return res.status(404).json({ message: "Siswa tidak ditemukan" });
  }

  if (checked) {
    // centang → naikkan verifiedStage
    siswa.verifiedStage = Math.max(siswa.verifiedStage, stage);
  } else {
    // uncentang → turunkan HANYA ke stage sebelumnya
    if (siswa.verifiedStage === stage) {
      siswa.verifiedStage = stage - 1;
    }
  }

  // ❗ JANGAN sentuh ini
  siswa.isVerifiedByAdmin = true;

  await siswa.save();

  res.json({
    success: true,
    verifiedStage: siswa.verifiedStage,
  });
};

//GET data hasil ujian
export const getSiswaWithResult = async (req, res) => {
  try {
    if (req.user.role !== "guru") {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    // 1. ambil semua siswa
    // const siswaList = await User.find({ role: "siswa" }).select("-password").lean();
    //filter dihilangkan untuk menyatukan tabel data siswa dan guru
    const siswaList = await User.find().select("-password").lean();

    // 2. ambil semua result
    const results = await ExamResult.find().select("user stage skor nilaiPerMapel").lean();

    // 3. gabungkan
    const data = siswaList.map((siswa) => {
      const siswaResults = results.filter((r) => r.user.toString() === siswa._id.toString());

      return {
        ...siswa,
        results: siswaResults,
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data siswa + hasil" });
  }
};

//======END HASIL SISWA======

//======MANAJEMEN DATA USER======
// export const createSiswa = async (req, res) => {
//   try {
//     // hanya guru
//     if (req.user.role !== "guru") {
//       return res.status(403).json({ message: "Akses ditolak" });
//     }

//     const { nama_lengkap, nis, password, sekolah_asal, email } = req.body;

//     // validasi sederhana
//     if (!nama_lengkap || !nis || !password || !sekolah_asal || !email) {
//       return res.status(400).json({ message: "Data belum lengkap" });
//     }

//     // cek NIS unik
//     const existing = await User.findOne({ nis });
//     if (existing) {
//       return res.status(400).json({ message: "NIS sudah terdaftar" });
//     }

//     // HASH PASSWORD (tetap pakai hash 👍)
//     const hashed = await bcrypt.hash(String(password), 10);

//     const siswa = await User.create({
//       nama_lengkap,
//       nis,
//       password: hashed,
//       sekolah_asal,
//       email,
//       role: "siswa",
//       verifiedStage: 0,
//       isVerifiedByAdmin: false,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Siswa berhasil ditambahkan",
//       data: {
//         id: siswa._id,
//         nama_lengkap: siswa.nama_lengkap,
//         nis: siswa.nis,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Gagal menambahkan siswa" });
//   }
// };

export const createSiswa = async (req, res) => {
  try {
    if (req.user.role !== "guru") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // TAMBAHKAN 'role' di sini agar bisa diambil dari frontend
    const { nama_lengkap, nis, password, sekolah_asal, email, role } = req.body;

    if (!nama_lengkap || !nis || !password || !email) {
      return res.status(400).json({ message: "Data belum lengkap" });
    }

    const existing = await User.findOne({ nis });
    if (existing) {
      return res.status(400).json({ message: "NIS/ID sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const userBaru = await User.create({
      nama_lengkap,
      nis,
      password: hashed,
      sekolah_asal: sekolah_asal || "Internal",
      email,
      // GANTI bagian ini supaya dinamis:
      role: role || "siswa",
      // Kalau dia guru, otomatis kasih akses penuh (stage 3 dan verified)
      verifiedStage: role === "guru" ? 3 : 0,
      isVerifiedByAdmin: role === "guru" ? true : false,
    });

    try {
      // Logic email tetap sama
      await sendAccountEmail(email, nis, password);
    } catch (mailErr) {
      console.error("Proses kirim email gagal:", mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: `${userBaru.role} berhasil ditambahkan`,
      data: userBaru,
    });
  } catch (err) {
    console.error("Error di createSiswa:", err);
    res.status(500).json({ message: "Gagal menambahkan user" });
  }
};

export const updateSiswa = async (req, res) => {
  try {
    if (req.user.role !== "guru") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const data = { ...req.body };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }

    const siswa = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select("-password");

    res.json(siswa);
  } catch (err) {
    res.status(500).json({ message: "Gagal update siswa" });
  }
};

export const deleteSiswa = async (req, res) => {
  try {
    if (req.user.role !== "guru") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus siswa" });
  }
};

// export const uploadSiswaExcel = async (req, res) => {
//   try {
//     if (req.user.role !== "guru") {
//       return res.status(403).json({ message: "Akses ditolak" });
//     }

//     const workbook = XLSX.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows = XLSX.utils.sheet_to_json(sheet);

//     let success = 0;
//     let failed = 0;

//     for (const row of rows) {
//       try {
//         if (!row.password) {
//           failed++;
//           continue;
//         }

//         const exist = await User.findOne({ nis: row.nis });
//         if (exist) {
//           failed++;
//           continue;
//         }

//         const hashed = await bcrypt.hash(String(row.password), 10);

//         await User.create({
//           nama_lengkap: row.nama_lengkap,
//           nis: row.nis,
//           password: hashed,
//           sekolah_asal: row.sekolah_asal,
//           email: row.email,
//           role: "siswa",
//         });

//         success++;
//       } catch {
//         failed++;
//       }
//     }

//     res.json({
//       message: "Upload selesai",
//       success,
//       failed,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Gagal upload excel siswa" });
//   }
// };

// Fungsi pembantu untuk memberikan jeda (delay)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const uploadSiswaExcel = async (req, res) => {
  try {
    // 1. Cek Role
    if (req.user.role !== "guru") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // 2. Baca File Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let success = 0;
    let failed = 0;
    let failedList = [];

    // console.log(`--- Memulai Import ${rows.length} Siswa ---`);

    for (const row of rows) {
      try {
        // Validasi kolom penting
        if (!row.password || !row.nis || !row.email) {
          failed++;
          failedList.push({ nis: row.nis || "N/A", reason: "Data tidak lengkap" });
          continue;
        }

        // Cek duplikasi NIS
        const exist = await User.findOne({ nis: row.nis });
        if (exist) {
          failed++;
          failedList.push({ nis: row.nis, reason: "NIS sudah terdaftar" });
          continue;
        }

        // Hash Password
        const hashed = await bcrypt.hash(String(row.password), 10);

        // Simpan ke DB
        await User.create({
          nama_lengkap: row.nama_lengkap,
          nis: row.nis,
          password: hashed,
          sekolah_asal: row.sekolah_asal,
          email: row.email,
          role: "siswa",
        });

        // KIRIM EMAIL
        // Kita gunakan await di sini agar server mengirim satu-satu
        // dan tidak membombardir server SMTP Google sekaligus
        await sendAccountEmail(row.email, row.nis, row.password);
        // console.log(`[${success + 1}] Email terkirim ke: ${row.email}`);

        success++;

        // BERI JEDA: Setiap 1 baris, tunggu 1 detik
        // Ini kunci agar Gmail tidak memblokir akun kamu (Rate Limiting)
        await delay(500);
      } catch (err) {
        console.error(`Gagal memproses baris NIS ${row.nis}:`, err.message);
        failed++;
        failedList.push({ nis: row.nis, reason: err.message });
      }
    }

    // console.log(`--- Import Selesai: ${success} Berhasil, ${failed} Gagal ---`);

    res.json({
      message: "Proses upload selesai",
      summary: {
        total: rows.length,
        success,
        failed,
      },
      details: failedList, // Memberikan info ke admin mana saja yang gagal
    });
  } catch (err) {
    console.error("Fatal Error Upload:", err);
    res.status(500).json({ message: "Gagal memproses file excel" });
  }
};

//======END MANAJEMEN DATA USER======

//======REGISTER SISWA========
export const registerSiswaMandiri = async (req, res) => {
  try {
    // ambil data dari body
    // console.log("Data masuk dari FE:", req.body);
    const { nama_lengkap, nis, password, sekolah_asal, email } = req.body;

    // validasi input
    if (!nama_lengkap || !nis || !password || !email || !sekolah_asal) {
      return res.status(400).json({ message: "Data pendaftaran belum lengkap" });
    }

    // validasi nis
    const existing = await User.findOne({ nis });
    if (existing) {
      return res.status(400).json({ message: "NIS sudah terdaftar, silakan login" });
    }

    // hash
    const hashed = await bcrypt.hash(String(password), 10);

    // simpan db
    const userBaru = await User.create({
      nama_lengkap,
      nis,
      password: hashed,
      sekolah_asal,
      email,
      role: "siswa",
      verifiedStage: 0,
      isVerifiedByAdmin: false,
    });

    // send mail
    try {
      await sendAccountEmail(email, nama_lengkap, nis, password);
    } catch (mailErr) {
      console.error("Gagal kirim email konfirmasi:", mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Pendaftaran berhasil, silakan login atau tunggu verifikasi",
      data: {
        nama: userBaru.nama_lengkap,
        nis: userBaru.nis,
      },
    });
  } catch (err) {
    console.error("Error di registerSiswaMandiri:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};
//======END REGISTER SISWA========
