import express from "express";
import { registerSiswaMandiri, getAllSiswa, getSiswaWithResult, verifySiswa, createSiswa, updateSiswa, deleteSiswa, uploadSiswaExcel } from "../controllers/guruController.js";
import { getSoalList, uploadSoalExcel, deleteSoal, updateSoal, createSoal } from "../controllers/guruSoalController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import uploadExcel from "../middleware/uploadExcel.js";

const router = express.Router();
//register siswa mandiri
router.post("/register", registerSiswaMandiri);

//hanya guru
//mengurusi tabel hasil siswa
router.get("/siswa", authMiddleware, getAllSiswa);
router.patch("/siswa/:id/verify", authMiddleware, verifySiswa);
router.get("/siswa-result", authMiddleware, getSiswaWithResult);

// manajemen siswa
router.post("/siswa", authMiddleware, createSiswa);
router.put("/siswa/:id", authMiddleware, updateSiswa);
router.delete("/siswa/:id", authMiddleware, deleteSiswa);

// upload siswa via excel
router.post("/siswa/upload", authMiddleware, uploadExcel.single("file"), uploadSiswaExcel);

//tabel soal
//upload soal dari excel
router.post("/soal/upload", authMiddleware, uploadExcel.single("file"), uploadSoalExcel);
//get soal semua
router.get("/soal", authMiddleware, getSoalList);
//delete soal
router.delete("/soal/:id", authMiddleware, deleteSoal);
//editsoal
router.put("/soal/:id", authMiddleware, updateSoal);
//tambah soal
router.post("/soal", authMiddleware, createSoal);

router.get("/test", (req, res) => {
  res.json({ ok: true });
});

export default router;
