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
    console.log("SESSION BE:", session);

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

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session tidak ditemukan" });
    }

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

    res.json({
      sessionId,
      expiresAt: session.expiresAt,
      soal: orderedSoal,
    });
  } catch (err) {
    console.error("GET SOAL SESSION ERROR:", err);
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
    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session tidak ditemukan" });
    }
    // console.log(req.body.sessionId);

    if (session.status === "finished") {
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

    res.json({
      message: "Ujian berhasil disubmit",
      skor,
      benar,
      salah,
      resultId: result._id,
    });
  } catch (err) {
    console.error(err);
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
