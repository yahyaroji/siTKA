import XLSX from "xlsx";
import Exam from "../models/examModel.js";

//======UPLOAD SOAL DARI EXCEL======

/**

 * helper: normalisasi string
 * - buang spasi
 * - samakan huruf besar / kecil

 */

// const normalize = (v) => String(v).trim().toLowerCase();
const normalize = (v) => (v !== undefined && v !== null ? String(v).trim() : "");
/**

 * parse 1 row excel → 1 soal

 */

// const parseRow = (row, rowNumber) => {
// const { mapel, stage, pertanyaan, opsiA, opsiB, opsiC, opsiD, jawabanBenar, multiple } = row;
const parseRow = (row, rowNumber) => {
  const { mapel = "", stage = "", pertanyaan = "", opsiA = "", opsiB = "", opsiC = "", opsiD = "", jawabanBenar = "", multiple = false, isMatrix = false, columns = "", sub_pertanyaan = "" } = row;

  // ===== VALIDASI WAJIB =====
  // if (!mapel || !stage || !pertanyaan) {
  //   throw new Error(`Baris ${rowNumber}: mapel / stage / pertanyaan wajib`);
  // }

  // if (!opsiA || !opsiB || !opsiC || !opsiD) {
  //   throw new Error(`Baris ${rowNumber}: opsi A–D wajib diisi`);
  // }

  // if (!jawabanBenar) {
  //   throw new Error(`Baris ${rowNumber}: jawabanBenar wajib`);
  // }

  if (!mapel || !stage || !pertanyaan) {
    throw new Error(`Baris ${rowNumber}: mapel / stage / pertanyaan wajib`);
  }

  // if (!jawabanBenar) {
  //   throw new Error(`Baris ${rowNumber}: jawabanBenar wajib`);
  // }

  // ===== OPSI =====
  //const opsi = [opsiA, opsiB, opsiC, opsiD].map((o) => o.toString().trim());

  // ===== MULTIPLE FLAG =====
  // const isMultiple = multiple === true || multiple === "TRUE" || multiple === "true" || multiple === 1;
  const _isMatrix = isMatrix === true || isMatrix === "TRUE" || isMatrix === "true" || isMatrix === 1;
  const _isMultiple = multiple === true || multiple === "TRUE" || multiple === "true" || multiple === 1;

  // ===== PARSE JAWABAN =====

  let finalSoal = {
    mapel: normalize(mapel),
    stage: Number(stage),
    pertanyaan: pertanyaan.toString().trim(),
    isMatrix: _isMatrix,
    multiple: _isMultiple,
  };

  if (_isMatrix) {
    // ===== LOGIKA MATRIX =====
    if (!columns || !sub_pertanyaan || !jawabanBenar) {
      throw new Error(`Baris ${rowNumber}: Kolom 'columns', 'sub_pertanyaan', dan 'jawabanBenar' wajib diisi untuk Matrix`);
    }

    const colArray = String(columns)
      .split(";")
      .map((c) => c.trim());
    const subArray = String(sub_pertanyaan)
      .split(";")
      .map((teks, idx) => ({
        id: String.fromCharCode(65 + idx),
        teks: teks.trim(),
      }));

    const kunciArray = String(jawabanBenar)
      .split(";")
      .map((k) => k.trim());

    if (kunciArray.length !== subArray.length) {
      throw new Error(`Baris ${rowNumber}: Jumlah jawaban (${kunciArray.length}) tidak sama dengan jumlah pernyataan (${subArray.length})`);
    }

    let jawabanMatrix = {};
    subArray.forEach((sub, index) => {
      jawabanMatrix[sub.id] = kunciArray[index];
    });

    finalSoal.columns = colArray;
    finalSoal.sub_pertanyaan = subArray;
    finalSoal.jawaban = jawabanMatrix;
    finalSoal.opsi = [];
  } else {
    // ===== LOGIKA PG / MULTIPLE =====
    // Cek opsi hanya jika bukan matrix
    if (!opsiA || !opsiB || !opsiC || !opsiD) {
      throw new Error(`Baris ${rowNumber}: Opsi A-D wajib diisi untuk soal pilihan ganda`);
    }

    const opsi = [opsiA, opsiB, opsiC, opsiD].map((o) => String(o).trim());
    let jawaban;

    if (_isMultiple) {
      jawaban = String(jawabanBenar)
        .split(";")
        .map((j) => normalize(j))
        .filter(Boolean);

      if (jawaban.length < 1) {
        throw new Error(`Baris ${rowNumber}: Jawaban multiple minimal 1`);
      }
    } else {
      jawaban = normalize(jawabanBenar);
    }

    finalSoal.opsi = opsi;
    finalSoal.jawaban = jawaban;
  }

  return finalSoal;
};

/**

 * POST /guru/soal/upload

 */

export const uploadSoalExcel = async (req, res) => {
  try {
    // ===== AUTH =====
    if (req.user.role !== "guru") {
      return res.status(403).json({
        message: "Akses ditolak",
      });
    }

    // ===== FILE CHECK =====
    if (!req.file) {
      return res.status(400).json({
        message: "File Excel wajib diupload",
      });
    }

    // ===== BACA EXCEL =====
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // convert sheet → array of object
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log("rows:", rows);
    if (rows.length === 0) {
      return res.status(400).json({
        message: "File Excel kosong",
      });
    }

    // ===== PARSING ROW =====

    const questions = [];

    const errors = [];

    rows.forEach((row, index) => {
      try {
        // index + 2 → baris excel asli (1 header)
        const soal = parseRow(row, index + 2);
        questions.push(soal);
      } catch (err) {
        console.log("Error pada baris:", index + 2, "->", err.message);
        errors.push(err.message);
      }
    });

    // ===== JIKA ADA ERROR =====

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Upload gagal",
        errors,
      });
    }

    // ===== SIMPAN KE MONGO =====
    await Exam.insertMany(questions);

    // ===== RESPONSE =====
    res.json({
      success: true,
      total: questions.length,
      message: "Soal berhasil diupload",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
};

//======END UPLOAD SOAL DARI EXCEL======

//======GET SOAL======
export const getSoalList = async (req, res) => {
  try {
    const { mapel, stage, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (mapel) filter.mapel = mapel;
    if (stage) filter.stage = Number(stage);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([Exam.find(filter).sort({ _id: -1 }).skip(skip).limit(Number(limit)), Exam.countDocuments(filter)]);

    res.json({
      data,
      total,
      page: Number(page),
      totalPage: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil soal" });
  }
};
//======END GET SOAL======

//======DELETE SOAL======
export const deleteSoal = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus soal" });
  }
};
//======END DELETE SOAL======

//======EDIT SOAL======
export const updateSoal = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Exam.findByIdAndUpdate(id, req.body, { new: true });

    res.json({
      message: "Soal berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update soal" });
  }
};

//======END EDIT SOAL======

//======TAMBAH SOAL======
export const createSoal = async (req, res) => {
  try {
    const soal = new Exam(req.body);
    await soal.save();

    res.status(201).json({
      message: "Soal berhasil ditambahkan",
      data: soal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah soal" });
  }
};

//======END TAMBAH SOAL======
