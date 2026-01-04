import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  mapel: { type: String, required: true }, // "bi" atau "mtk"
  stage: { type: Number, required: true }, // 1,2,3
  pertanyaan: { type: String, required: true },
  opsi: { type: [String], required: true }, // 4 opsi
  jawaban: { type: mongoose.Schema.Types.Mixed }, // number or array
  isMatrix: { type: Boolean, default: false }, // Flag baru
  multiple: { type: Boolean, default: false },
  //khusus untuk soal matrix
  columns: { type: [String] }, // Contoh: ["Benar", "Salah"] atau ["Ya", "Tidak"]
  sub_pertanyaan: [
    {
      id: String,
      teks: String,
    },
  ],
});

export default mongoose.model("Exam", questionSchema);
