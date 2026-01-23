import Exam from "../models/examModel.js";
import ExamResult from "../models/examResultModel.js";
import ExamSession from "../models/ExamSessionModel.js";

// ============================
// HELPER: SHUFFLE ARRAY
// ============================
const shuffle = (arr) => {
  return [...arr].sort(() => Math.random() - 0.5);
};

// ============================
// EXAM SESSION START
// ============================
export const startExam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stage } = req.body;

    const existing = await ExamSession.findOne({
      user: userId,
      stage: stage,
      status: "ongoing", // Samakan dengan getActiveSession
      expiresAt: { $gt: new Date() }, // Sesi dianggap aktif jika waktu belum habis
    });

    if (existing) {
      return res.json({
        message: "Lanjutkan ujian",
        sessionId: existing._id,
        expiresAt: existing.expiresAt, // Berikan info waktu juga
      });
    }

    // --- TAMBAHAN: Cek apakah user sudah PERNAH mengerjakan stage ini ---
    const finished = await ExamSession.findOne({
      user: userId,
      stage: stage,
      status: "finished",
    });

    if (finished) {
      return res.status(400).json({ message: "Anda sudah menyelesaikan ujian tahap ini." });
    }

    // 2. Ambil soal
    const soal = await Exam.find({ stage }).select("_id mapel");

    if (!soal.length) {
      return res.status(404).json({ message: "Soal tidak ditemukan dari BE" });
    }

    // 3. Pisah & acak per mapel
    const bi = shuffle(soal.filter((s) => s.mapel === "bi"));
    const mtk = shuffle(soal.filter((s) => s.mapel === "mtk"));

    const soalOrder = [...bi, ...mtk].map((s) => s._id);

    // 4. Tentukan waktu ujian (misal 20 menit)
    const durationMinutes = 120;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    //5. Simpan session
    const session = await ExamSession.create({
      user: userId,
      stage,
      soalOrder,
      startedAt,
      expiresAt,
      status: "ongoing",
    });
    // console.log("SESSION BE:", session);

    res.json({
      message: "Ujian dimulai",
      sessionId: session._id,
      expiresAt,
    });
  } catch (err) {
    console.error("START EXAM ERROR:", err);
    res.status(500).json({ message: "Gagal memulai ujian" });
  }
};

// SOAL BY SESSION ID
export const getSoalBySession = async (req, res) => {
  // console.log("MASUK getSoalByIdSession BE");
  try {
    const { sessionId } = req.params;
    //siapa yang klik mulai ujian
    const session = await ExamSession.findById(sessionId).populate("user", "nama_lengkap");
    if (!session) {
      return res.status(404).json({ message: "Session tidak ditemukan" });
    }

    // Sekarang kamu bisa mengambil nama asli dari objek user hasil populate
    const namaSiswa = session.user?.nama_lengkap || "Siswa";
    console.log(`[EXAM] ${namaSiswa}  sedang memuat soal`);

    // ambil soal sesuai urutan session
    const soal = await Exam.find({
      _id: { $in: session.soalOrder },
    }).select("-jawaban");

    // urutkan sesuai soalOrder
    const soalMap = {};
    soal.forEach((q) => {
      soalMap[q._id.toString()] = q;
    });

    const orderedSoal = session.soalOrder
      .map((id) => soalMap[id.toString()])
      .filter(Boolean)
      .map((q) => ({
        ...q.toObject(),
        opsi: q.opsi,
      }));

    // Log saat soal berhasil dikirim (Opsional, tapi bagus untuk monitoring trafik)
    console.log(`[EXAM] Success: ${orderedSoal.length} soal terkirim ke ${namaSiswa}`);

    res.json({
      sessionId,
      expiresAt: session.expiresAt,
      soal: orderedSoal,
    });
  } catch (err) {
    // Log error di sini sangat penting karena ini adalah kegagalan sistem
    console.error(`[CRITICAL] GET SOAL ERROR ${namaSiswa}:`, err.message);
    res.status(500).json({ message: "Gagal memuat soal ujian" });
  }
};

export const submitExam = async (req, res) => {
  // console.log("Data masuk:", req.body);
  try {
    const { sessionId, jawaban } = req.body;

    if (!sessionId || !jawaban) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // 1. Ambil session
    const session = await ExamSession.findById(sessionId).populate("user", "nama_lengkap");
    if (!session) {
      return res.status(404).json({ message: "Session tidak ditemukan" });
    }
    // i. Log Identitas Awal (Ambil nama/NIS dari req.user hasil middleware)
    const userLog = session.user.nama_lengkap || "Unknown";
    console.log(`[SUBMIT_START] ${userLog}`);

    if (session.status === "finished") {
      console.log(`[SUBMIT_REJECT] ${userLog}`);
      return res.status(400).json({ message: "Ujian sudah disubmit" });
    }

    // 2. Ambil soal sesuai urutan session
    const soal = await Exam.find({
      _id: { $in: session.soalOrder },
    });

    // 3. Hitung skor
    const mapelStat = {
      bi: { benar: 0, total: 0 },
      mtk: { benar: 0, total: 0 },
    };

    let totalRasioBenar = 0;

    // 3. Hitung skor
    soal.forEach((q) => {
      const jawabUser = jawaban[q._id];
      mapelStat[q.mapel].total++;

      let rasioSoalIni = 0;

      if (q.isMatrix) {
        // --- LOGIKA MATRIX (SPLIT) ---
        const kunci = q.jawaban || {};
        const user = jawabUser || {};
        const keys = Object.keys(kunci);

        let subBenar = 0;
        keys.forEach((key) => {
          // Bandingkan dengan aman (Case-Insensitive)
          const valUser = String(user[key] || "")
            .trim()
            .toLowerCase();
          const valKunci = String(kunci[key] || "")
            .trim()
            .toLowerCase();
          if (valUser === valKunci) subBenar++;
        });

        rasioSoalIni = keys.length > 0 ? subBenar / keys.length : 0;
      } else if (q.multiple) {
        // --- LOGIKA MULTIPLE (SPLIT + PROTEKSI) ---
        const kunciArr = q.jawaban || [];
        const userArr = jawabUser || [];

        // Proteksi HANYA untuk Multiple Choice
        // Jika pilih semua opsi atau lebih dari 3, poin 0
        if (userArr.length >= q.opsi.length || userArr.length > 3) {
          rasioSoalIni = 0;
        } else {
          let benarCount = 0;
          // let adaSalah = false;

          // Normalisasi kunci ke lowercase untuk pengecekan
          const lowKunci = kunciArr.map((k) => String(k).trim().toLowerCase());

          userArr.forEach((val) => {
            if (lowKunci.includes(String(val).trim().toLowerCase())) {
              benarCount++;
            }
          });
          // Menghitung rasio, tapi dikunci maksimal di angka 1
          rasioSoalIni = kunciArr.length > 0 ? Math.min(1, benarCount / kunciArr.length) : 0;
          // rasioSoalIni = kunciArr.length > 0 ? benarCount / kunciArr.length : 0;
        }
      } else {
        // Pilihan Ganda Biasa
        const valUser = String(jawabUser || "")
          .trim()
          .toLowerCase();
        const valKunci = String(q.jawaban || "")
          .trim()
          .toLowerCase();

        if (valUser === valKunci) {
          rasioSoalIni = 1;
        }
      }

      // Akumulasi rasio ke statistik mapel dan total
      mapelStat[q.mapel].benar += rasioSoalIni;
      totalRasioBenar += rasioSoalIni;
    });

    // ii. Log Hasil Kalkulasi (Sangat penting untuk audit)
    console.log(`[SUBMIT_CALC_DONE] ${userLog}`);

    // 4. Hitung nilai per mapel skala 100 (1 angka di belakang koma)
    const nilaiPerMapel = {
      bi: mapelStat.bi.total === 0 ? 0 : parseFloat(((mapelStat.bi.benar / mapelStat.bi.total) * 100).toFixed(1)),

      mtk: mapelStat.mtk.total === 0 ? 0 : parseFloat(((mapelStat.mtk.benar / mapelStat.mtk.total) * 100).toFixed(1)),
    };

    // total skor untuk perangkingan
    const skor = parseFloat((nilaiPerMapel.bi + nilaiPerMapel.mtk).toFixed(1));

    // Statistik jumlah benar & salah global
    const totalSoal = soal.length;
    const benar = parseFloat(totalRasioBenar.toFixed(1));
    const salah = parseFloat((totalSoal - totalRasioBenar).toFixed(1));

    const fixSplit = (benar, total) => {
      const b = parseFloat(benar.toFixed(1));
      const s = parseFloat((total - b).toFixed(1));
      return { benar: b, salah: s };
    };

    const biResult = fixSplit(mapelStat.bi.benar, mapelStat.bi.total);
    const mtkResult = fixSplit(mapelStat.mtk.benar, mapelStat.mtk.total);

    // 4. Simpan hasil ujian
    const result = await ExamResult.create({
      user: session.user,
      session: session._id,
      stage: session.stage,
      totalSoal,
      benar,
      salah,
      nilaiPerMapel,
      detailPerMapel: {
        // bi: { benar: mapelStat.bi.benar, salah: mapelStat.bi.total - mapelStat.bi.benar },
        // mtk: { benar: mapelStat.mtk.benar, salah: mapelStat.mtk.total - mapelStat.mtk.benar },
        bi: biResult,
        mtk: mtkResult,
      },
      skor,
      jawaban,
    });

    // 5. Update session
    session.status = "finished";
    session.finishedAt = new Date();
    await session.save();

    // 3. Log Sukses Akhir
    console.log(`[SUBMIT_SUCCESS] ${userLog}`);
    res.json({
      message: "Ujian berhasil disubmit",
      skor,
      benar,
      salah,
      resultId: result._id,
    });
  } catch (err) {
    console.error(`[SUBMIT_ERROR] ${userLog} - Pesan: ${err.message}`);
    res.status(500).json({ message: "Gagal submit ujian" });
  }
};

//sesi aktif
export const getActiveSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await ExamSession.findOne({
      user: userId,
      status: "ongoing", // PAKAI INI (bukan isFinished)
    });

    if (!session) {
      return res.json(null);
    }

    res.json({
      sessionId: session._id,
      stage: session.stage,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error("GET ACTIVE SESSION ERROR:", err);
    res.status(500).json({ message: "Gagal cek sesi aktif" });
  }
};

// fitur live score
export const syncLiveProgress = async (req, res) => {
  try {
    const { sessionId, soalId, jawabanUserSingle } = req.body;

    if (!sessionId || !soalId) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // 1. Ambil Kunci Jawaban (Hanya soal yang sedang dikerjakan)
    const q = await Exam.findById(soalId).select("jawaban isMatrix multiple opsi mapel");
    if (!q) return res.status(404).json({ message: "Soal tidak ditemukan" });

    // 2. LOGIKA HITUNG SKOR (Persis seperti di submitExam)
    let rasioSoalIni = 0;

    if (q.isMatrix) {
      // --- LOGIKA MATRIX ---
      const kunci = q.jawaban || {};
      const user = jawabanUserSingle || {};
      const keys = Object.keys(kunci);
      let subBenar = 0;
      keys.forEach((key) => {
        const valUser = String(user[key] || "")
          .trim()
          .toLowerCase();
        const valKunci = String(kunci[key] || "")
          .trim()
          .toLowerCase();
        if (valUser === valKunci) subBenar++;
      });
      rasioSoalIni = keys.length > 0 ? subBenar / keys.length : 0;
    } else if (q.multiple) {
      // --- LOGIKA MULTIPLE CHOICE ---
      const kunciArr = q.jawaban || [];
      const userArr = jawabanUserSingle || [];

      // Proteksi: Jika pilih semua atau > 3, poin 0
      if (userArr.length >= q.opsi.length || userArr.length > 3) {
        rasioSoalIni = 0;
      } else {
        let benarCount = 0;
        const lowKunci = kunciArr.map((k) => String(k).trim().toLowerCase());
        userArr.forEach((val) => {
          if (lowKunci.includes(String(val).trim().toLowerCase())) benarCount++;
        });
        rasioSoalIni = kunciArr.length > 0 ? Math.min(1, benarCount / kunciArr.length) : 0;
      }
    } else {
      // --- PILIHAN GANDA BIASA ---
      const valUser = String(jawabanUserSingle || "")
        .trim()
        .toLowerCase();
      const valKunci = String(q.jawaban || "")
        .trim()
        .toLowerCase();
      if (valUser === valKunci) rasioSoalIni = 1;
    }

    // 3. UPDATE KE EXAM SESSION (Atomic Update)
    // Mencoba update jika soal sudah pernah dijawab sebelumnya
    const updatedSession = await ExamSession.findOneAndUpdate(
      {
        _id: sessionId,
        status: "ongoing",
        "answers.soalId": soalId,
      },
      {
        $set: {
          "answers.$.jawaban": jawabanUserSingle,
          "answers.$.rasio": rasioSoalIni,
          "answers.$.mapel": q.mapel,
          "answers.$.updatedAt": new Date(),
        },
      },
      { new: true },
    );

    // 4. Jika soal belum pernah dijawab, tambahkan data baru ke array answers
    if (!updatedSession) {
      await ExamSession.findOneAndUpdate(
        { _id: sessionId, status: "ongoing" },
        {
          $push: {
            answers: {
              soalId,
              jawaban: jawabanUserSingle,
              rasio: rasioSoalIni,
              mapel: q.mapel,
            },
          },
        },
      );
    }

    res.json({ success: true, currentRatio: rasioSoalIni });
  } catch (err) {
    console.error(`[LIVE_SYNC_ERROR] ${err.message}`);
    res.status(500).json({ message: "Gagal sinkronisasi live" });
  }
};

export const getLiveMonitoring = async (req, res) => {
  try {
    const { stage } = req.query;

    const monitoringData = await ExamSession.aggregate([
      {
        $match: {
          stage: parseInt(stage) || 1,
          status: { $in: ["ongoing", "finished"] },
        },
      },

      // Konversi ID ke ObjectId agar Lookup tidak gagal
      {
        $addFields: {
          soalOrderObj: {
            $map: {
              input: "$soalOrder",
              as: "id",
              in: { $toObjectId: "$$id" },
            },
          },
        },
      },

      // Ambil Data User
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: "$userData" },

      // Ambil Data Soal menggunakan ID yang sudah dikonversi
      {
        $lookup: {
          from: "exams",
          localField: "soalOrderObj",
          foreignField: "_id",
          as: "soalLengkap",
        },
      },

      {
        $project: {
          nama: "$userData.nama_lengkap",
          status: "$status",
          terjawab: { $size: { $ifNull: ["$answers", []] } },
          totalSoal: { $size: "$soalOrder" },
          lastActive: "$updatedAt",

          // Hitung Total Soal BI & MTK sebagai pembagi
          totalBI: {
            $size: { $filter: { input: "$soalLengkap", as: "s", cond: { $eq: ["$$s.mapel", "bi"] } } },
          },
          totalMTK: {
            $size: { $filter: { input: "$soalLengkap", as: "s", cond: { $eq: ["$$s.mapel", "mtk"] } } },
          },

          // Ambil poin dari answers yang sudah ada mapelnya
          poinBI: {
            $sum: {
              $map: {
                input: { $filter: { input: { $ifNull: ["$answers", []] }, as: "a", cond: { $eq: ["$$a.mapel", "bi"] } } },
                as: "item",
                in: "$$item.rasio",
              },
            },
          },
          poinMTK: {
            $sum: {
              $map: {
                input: { $filter: { input: { $ifNull: ["$answers", []] }, as: "a", cond: { $eq: ["$$a.mapel", "mtk"] } } },
                as: "item",
                in: "$$item.rasio",
              },
            },
          },
        },
      },

      {
        $project: {
          nama: 1,
          status: 1,
          terjawab: 1,
          totalSoal: 1,
          lastActive: 1,
          // Gunakan pembagi dinamis, jika totalBI/MTK belum terhitung (0), skor 0
          nilaiBI: {
            $cond: [{ $gt: ["$totalBI", 0] }, { $round: [{ $multiply: [{ $divide: ["$poinBI", "$totalBI"] }, 100] }, 1] }, 0],
          },
          nilaiMTK: {
            $cond: [{ $gt: ["$totalMTK", 0] }, { $round: [{ $multiply: [{ $divide: ["$poinMTK", "$totalMTK"] }, 100] }, 1] }, 0],
          },
        },
      },
      {
        $addFields: {
          totalSkor: { $add: ["$nilaiBI", "$nilaiMTK"] },
        },
      },
      { $sort: { totalSkor: -1 } },
    ]);

    res.json(monitoringData);
  } catch (err) {
    console.error("Error Monitoring:", err);
    res.status(500).json({ message: "Gagal memproses data monitoring" });
  }
};

// end fitur live score
