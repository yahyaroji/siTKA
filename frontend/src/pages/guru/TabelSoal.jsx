import { useEffect, useState } from "react";
import { getSoalList, deleteSoal, updateSoal, createSoal, uploadSoalExcel } from "../../api/guruService";

export default function TabelSoal() {
  const [data, setData] = useState([]);
  const [mapel, setMapel] = useState("");
  const [stage, setStage] = useState("");
  const [page, setPage] = useState(1);
  const [editingSoal, setEditingSoal] = useState(null);
  const [totalPage, setTotalPage] = useState(1);
  const limit = 15;

  const loadSoal = async (isMounted = true) => {
    try {
      const params = { page, limit };
      if (mapel) params.mapel = mapel;
      if (stage) params.stage = stage;

      const res = await getSoalList(params);

      if (!isMounted) return; // ⬅️ PENTING

      setData(res.data.data || []);
      setTotalPage(res.data.totalPage || 1);
    } catch (err) {
      console.error("Gagal load soal:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      try {
        await loadSoal(isMounted);
      } catch (e) {
        console.error(e);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [mapel, stage, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus soal ini?")) return;

    try {
      await deleteSoal(id);
      loadSoal(); // refresh setelah delete
    } catch (err) {
      console.error("Gagal hapus soal:", err);
    }
  };
  //fungsi edit soal
  const [form, setForm] = useState({
    pertanyaan: "",
    mapel: "",
    stage: "",
    opsi: ["", "", "", ""],
    jawaban: "",
    multiple: false,
    isMatrix: false,
    columns: "", // kita handle sebagai string "Benar;Salah" agar mudah diedit
    sub_pertanyaan: "", // kita handle sebagai string "Pernyataan 1;Pernyataan 2"
  });

  const handleEdit = (soal) => {
    setEditingSoal(soal);
    setForm({
      pertanyaan: soal.pertanyaan,
      mapel: soal.mapel,
      stage: soal.stage,
      opsi: soal.opsi || ["", "", "", ""],
      // Jika matrix, jawaban biasanya object {A: "Benar", B: "Salah"}
      // Kita ubah jadi string "Benar;Salah" agar konsisten cara inputnya
      jawaban: soal.isMatrix ? Object.values(soal.jawaban).join(";") : Array.isArray(soal.jawaban) ? soal.jawaban.join(";") : soal.jawaban,
      multiple: soal.multiple || false,
      isMatrix: soal.isMatrix || false,
      columns: soal.isMatrix ? soal.columns.join(";") : "",
      sub_pertanyaan: soal.isMatrix ? soal.sub_pertanyaan.map((s) => s.teks).join(";") : "",
    });
  };

  const validateSoal = (form) => {
    if (!form.pertanyaan.trim()) return "Pertanyaan wajib diisi";
    if (!form.jawaban) return "Kunci jawaban belum dipilih"; // Cek null/undefined

    if (form.isMatrix) {
      // 1. Ambil array pernyataan & bersihkan dari string kosong
      const subArr = String(form.sub_pertanyaan || "")
        .split(";")
        .filter(Boolean);

      // 2. Ambil array jawaban & bersihkan dari string kosong
      // Kita filter(Boolean) supaya kalau ada ";;" di tengah tidak dihitung sebagai jawaban
      const jawArr = String(form.jawaban || "")
        .split(";")
        .filter(Boolean);

      if (!form.columns.trim()) return "Kolom kategori matrix (misal: Benar;Salah) wajib diisi";
      if (subArr.length === 0) return "Daftar pernyataan matrix wajib diisi";

      // --- VALIDASI UTAMA MATRIX ---
      // Cek apakah jumlah jawaban sudah sesuai dengan jumlah pernyataan
      if (jawArr.length < subArr.length) {
        const sisa = subArr.length - jawArr.length;
        return `Kunci jawaban belum lengkap! Masih kurang ${sisa} baris lagi yang belum dipilih.`;
      }

      if (jawArr.length > subArr.length) {
        return "Jumlah kunci jawaban melebihi jumlah pernyataan. Periksa kembali inputan Anda.";
      }
    } else {
      // ... (Logika validasi Pilihan Ganda kamu yang sudah ada sebelumnya)
      const opsi = form.opsi.map((o) => o.trim()).filter(Boolean);
      const jawabanArr = String(form.jawaban || "")
        .split(";")
        .filter(Boolean);

      // Proteksi skor multiple yang tadi
      if (form.multiple) {
        if (jawabanArr.length > 3) return "Maksimal 3 jawaban benar!";
        if (jawabanArr.length >= opsi.length) return "Tidak boleh pilih semua opsi!";
      }
    }

    return null;
  };

  //handleUpdate dengan validasi
  const handleUpdate = async () => {
    const error = validateSoal(form);
    if (error) {
      alert(error);
      return;
    }

    try {
      let payload = {
        pertanyaan: form.pertanyaan,
        mapel: form.mapel,
        stage: form.stage,
        multiple: form.isMatrix ? false : form.multiple, // Matrix biasanya bukan multiple ganda
        isMatrix: form.isMatrix,
      };

      if (form.isMatrix) {
        const colArr = form.columns.split(";").map((c) => c.trim());
        const subTeksArr = form.sub_pertanyaan.split(";").map((s) => s.trim());
        const jawArr = form.jawaban.split(";").map((j) => j.trim());

        payload.columns = colArr;
        // Transform ke format object [{id: 'A', teks: '...'}, dst]
        payload.sub_pertanyaan = subTeksArr.map((teks, idx) => ({
          id: String.fromCharCode(65 + idx),
          teks,
        }));
        // Transform ke format object {A: 'Benar', B: 'Salah'}
        let jawObj = {};
        payload.sub_pertanyaan.forEach((sub, idx) => {
          jawObj[sub.id] = jawArr[idx];
        });
        payload.jawaban = jawObj;
        payload.opsi = []; // Kosongkan opsi jika matrix
      } else {
        payload.opsi = form.opsi.map((o) => o.trim());
        payload.jawaban = form.multiple ? form.jawaban.split(";").map((j) => j.trim()) : form.jawaban.trim();
        payload.columns = [];
        payload.sub_pertanyaan = [];
      }

      await updateSoal(editingSoal._id, payload);
      setEditingSoal(null);
      loadSoal();
      alert("Soal berhasil diperbarui!");
    } catch (err) {
      console.error("Gagal update soal:", err);
    }
  };

  //fungsi edit soal sampai sini

  //fungsi tambah soal
  const [showAddForm, setShowAddForm] = useState(false);

  const [addForm, setAddForm] = useState({
    pertanyaan: "",
    mapel: "bi",
    stage: 1,
    opsi: ["", "", "", ""],
    jawaban: "",
    multiple: false,
    isMatrix: false, // Tambahkan ini
    columns: "", // Tambahkan ini
    sub_pertanyaan: "", // Tambahkan ini
  });

  const handleCreate = async () => {
    // Gunakan fungsi validateSoal yang sudah kita perbarui di fitur Edit sebelumnya
    const error = validateSoal(addForm);
    if (error) {
      alert(error);
      return;
    }

    try {
      let payload = {
        pertanyaan: addForm.pertanyaan,
        mapel: addForm.mapel,
        stage: addForm.stage,
        isMatrix: addForm.isMatrix,
      };

      if (addForm.isMatrix) {
        // --- PROSES DATA MATRIX ---
        const colArr = addForm.columns.split(";").map((c) => c.trim());
        const subTeksArr = addForm.sub_pertanyaan.split(";").map((s) => s.trim());
        const jawArr = addForm.jawaban.split(";").map((j) => j.trim());

        payload.columns = colArr;
        payload.sub_pertanyaan = subTeksArr.map((teks, idx) => ({
          id: String.fromCharCode(65 + idx),
          teks,
        }));

        let jawObj = {};
        payload.sub_pertanyaan.forEach((sub, idx) => {
          jawObj[sub.id] = jawArr[idx];
        });
        payload.jawaban = jawObj;
        payload.opsi = []; // Kosongkan opsi
        payload.multiple = false;
      } else {
        // --- PROSES DATA STANDAR ---
        payload.opsi = addForm.opsi.map((o) => o.trim());
        payload.multiple = addForm.multiple;
        payload.jawaban = addForm.multiple ? addForm.jawaban.split(";").map((j) => j.trim()) : addForm.jawaban.trim();
        payload.columns = [];
        payload.sub_pertanyaan = [];
      }

      await createSoal(payload);

      // Reset form ke awal
      setShowAddForm(false);
      setAddForm({
        pertanyaan: "",
        mapel: "bi",
        stage: 1,
        opsi: ["", "", "", ""],
        jawaban: "",
        multiple: false,
        isMatrix: false,
        columns: "",
        sub_pertanyaan: "",
      });

      loadSoal();
      alert("Soal berhasil ditambahkan!");
    } catch (err) {
      console.error("Gagal tambah soal:", err);
    }
  };

  //fungsi tambah soal sampai sini

  //fungsi upload soal excel
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const handleUploadExcel = async () => {
    if (!excelFile) {
      alert("Pilih file excel dulu");
      return;
    }

    try {
      setUploading(true);

      await uploadSoalExcel(excelFile);

      alert("Upload soal berhasil");

      setExcelFile(null);
      loadSoal(); // refresh tabel
    } catch (err) {
      console.error("Gagal upload excel:", err);
      alert("Gagal upload soal");
    } finally {
      setUploading(false);
    }
  };

  //end fungsi upload soal excel

  // helper untuk togle jawaban
  const toggleJawabanSelection = (currentForm, setFunc, teksOpsi) => {
    // Jika teks opsi kosong, jangan biarkan jadi kunci
    if (!teksOpsi.trim()) return;

    if (currentForm.multiple) {
      // Mode Multiple: Pecah string jadi array, tambah/hapus, gabung lagi
      let jawArr = currentForm.jawaban ? currentForm.jawaban.split(";").filter(Boolean) : [];
      if (jawArr.includes(teksOpsi)) {
        jawArr = jawArr.filter((j) => j !== teksOpsi);
      } else {
        jawArr.push(teksOpsi);
      }
      setFunc({ ...currentForm, jawaban: jawArr.join(";") });
    } else {
      // Mode Single: Langsung ganti string jawaban
      setFunc({ ...currentForm, jawaban: teksOpsi });
    }
  };
  // end helper untuk togle jawaban

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          {/* <div className="w-2 h-10 bg-[#FFD600] rounded-full border-2 border-black"></div> */}
          {/* <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Manajemen Bank Soal</h1> */}
        </div>

        <div className="flex items-center gap-4">
          {/* Tombol Tambah - Hitam Kuning */}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#2196f3] text-white px-6 py-3 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            + ADD QUESTION
          </button>

          {/* Tombol Import - Biru Saweria biar senada sama Preview */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#FFD600] text-black px-6 py-3 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            IMPORT EXCEL
          </button>
        </div>
      </div>
      {/* END HEADER DASHBOARD */}

      {/* FILTER SECTION - Neo-Brutal Upgrade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-white p-8 rounded-[2.5rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        {/* Filter Mapel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 ml-2">
            <div className="w-1.5 h-4 bg-[#2196f3] rounded-full border border-black"></div>
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Subjects</span>
          </div>
          <select
            className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all cursor-pointer"
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
          >
            <option value="">ALL SUBJECTS</option>
            <option value="bi">INDONESIAN</option>
            <option value="mtk">MATHEMATICS</option>
          </select>
        </div>

        {/* Filter Stage */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 ml-2">
            <div className="w-1.5 h-4 bg-[#FFD600] rounded-full border border-black"></div>
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Stages</span>
          </div>
          <select
            className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all cursor-pointer"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">ALL STAGES</option>
            <option value="1">STAGE 1</option>
            <option value="2">STAGE 2</option>
            <option value="3">STAGE 3</option>
          </select>
        </div>

        {/* Info Counter */}
        <div className="flex flex-col justify-end items-end pb-1">
          <div className="bg-gray-100 border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black text-black uppercase tracking-widest">
              Total: <span className="text-[#2196f3] text-lg ml-1">{data.length}</span> Questions
            </p>
          </div>
        </div>
      </div>
      {/* END FILTER SECTION */}

      {/* TABLE AREA */}
      <div className="bg-white rounded-[2.5rem] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Tambahkan table-fixed supaya lebar kolom yang kita set dipatuhi si browser */}
        <table className="table w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-black text-white border-b-[3px] border-black">
              <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] text-center w-24">Stage</th>
              <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] w-40">Subject</th>
              <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Question</th>
              {/* Kita kasih pr-12 (padding kanan) biar tulisan AKSI gak nempel ke pojokan melengkung */}
              <th className="p-6 pr-12 font-black uppercase text-[10px] tracking-[0.2em] text-center  w-52">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-gray-100">
            {data.map((s) => (
              <tr key={s._id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-5 text-center">
                  <span className="inline-block whitespace-nowrap font-mono font-black px-4 py-2 bg-[#FFD600] text-black border-[2px] border-black rounded-xl text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    S-{s.stage}
                  </span>
                </td>

                <td className="p-5">
                  <span className="inline-block font-black text-[10px] uppercase tracking-widest text-[#2196f3] bg-blue-50 px-4 py-1.5 rounded-full border-2 border-blue-100">
                    {s.mapel === "bi" ? "BI" : "Math"}
                  </span>
                </td>

                <td className="p-5 text-left">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-black leading-relaxed line-clamp-2 text-sm uppercase italic opacity-80">{s.pertanyaan.replace(/@@/g, " ").replace(/\|/g, " ")}</p>
                    <div className="flex gap-2">
                      {s.isMatrix && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Matrix</span>}
                      {s.multiple && <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-widest">Multiple</span>}
                    </div>
                  </div>
                </td>

                {/* SAMA DENGAN HEADER: Kasih pr-12 dan text-right supaya menjauh dari lengkungan pojok */}
                <td className="p-5 pr-12">
                  <div className="flex justify-end items-center gap-4">
                    <button onClick={() => handleEdit(s)} className="font-black text-[10px] uppercase tracking-[0.15em] text-black hover:text-[#2196f3]">
                      EDIT
                    </button>
                    <div className="w-[1.5px] h-4 bg-black/20"></div>
                    <button onClick={() => handleDelete(s._id)} className="font-black text-[10px] uppercase tracking-[0.15em] text-red-500 hover:text-red-700 transition-all hover:scale-110">
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* END TABLE AREA */}

      {/* ----------------MODAL------------- */}

      {/* modal upload soal excel */}
      {showUploadModal && (
        /* Tambahkan overflow-y-auto dan hapus items-center */
        <div className="fixed inset-0 z-999 bg-black/40 backdrop-blur-sm overflow-y-auto overflow-x-hidden">
          {/* Gunakan items-start dan py-12 agar posisi konsisten dengan modal lainnya */}
          <div className="flex min-h-screen items-start justify-center p-4 py-12">
            <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative transition-all animate-in fade-in zoom-in duration-200">
              {/* Header Modal */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#FFD600] rounded-full border-2 border-black"></div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Upload Soal Excel</h3>
              </div>

              <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">
                Pilih file format <span className="font-bold text-black">.xlsx</span> atau <span className="font-bold text-black">.xls</span>. Pastikan format kolom sudah sesuai template.
              </p>

              {/* Custom Input File Area */}
              <div className="relative group">
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-200 group-hover:border-black transition-colors rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-gray-50">
                  <span className="text-2xl">📊</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{excelFile ? excelFile.name : "Klik atau seret file ke sini"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleUploadExcel}
                  disabled={!excelFile || uploading}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1
            ${!excelFile || uploading ? "bg-gray-100 text-gray-400 border-gray-200 shadow-none cursor-not-allowed" : "bg-[#FFD600] text-black hover:bg-[#ffe033]"}`}
                >
                  {uploading ? "Sabar ya, lagi di-upload..." : "Konfirmasi Upload"}
                </button>

                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setExcelFile(null);
                  }}
                  className="w-full py-3 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                >
                  Batalkan Proses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* end modal upload soal excel */}

      {/* form tambah soal */}
      {showAddForm && (
        /* 1. Wrapper Luar: Tambahkan overflow-y-auto */
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm overflow-y-auto overflow-x-hidden">
          {/* 2. Flex Container: 
          - Ganti items-center jadi items-start
          - Tambahkan py-12 (padding atas bawah) agar modal punya jarak dari tepi browser
    */}
          <div className="flex min-h-screen items-start justify-center p-4 py-12">
            {/* 3. Kartu Modal: Hapus 'my-8' karena sudah dihandle oleh 'py-12' di atas */}
            <div className="bg-white w-full max-w-2xl p-8 rounded-[2.5rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative transition-all animate-in fade-in zoom-in duration-200">
              {/* Header Modal */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#FFD600] rounded-full border-2 border-black"></div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-black">Tambah Soal Baru</h3>
              </div>

              <div className="space-y-6">
                {/* Row 1: Tipe Soal & Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Tipe Soal</label>
                    <select
                      className="w-full p-3 rounded-2xl border-2 border-black font-bold text-sm bg-white cursor-pointer"
                      value={addForm.isMatrix ? "matrix" : "standar"}
                      onChange={(e) => setAddForm({ ...addForm, isMatrix: e.target.value === "matrix", jawaban: "" })}
                    >
                      <option value="standar">Pilihan Ganda</option>
                      <option value="matrix">Matrix (Tabel)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Subjects</label>
                    <select
                      className="w-full p-3 rounded-2xl border-2 border-black font-bold text-sm bg-white uppercase cursor-pointer"
                      value={addForm.mapel}
                      onChange={(e) => setAddForm({ ...addForm, mapel: e.target.value })}
                    >
                      <option value="bi">Bahasa Indonesia</option>
                      <option value="mtk">Matematika</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Stage</label>
                    <select
                      className="w-full p-3 rounded-2xl border-2 border-black font-bold text-sm bg-white cursor-pointer"
                      value={addForm.stage}
                      onChange={(e) => setAddForm({ ...addForm, stage: Number(e.target.value) })}
                    >
                      <option value={1}>Stage 1</option>
                      <option value={2}>Stage 2</option>
                      <option value={3}>Stage 3</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Pertanyaan */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Isi Pertanyaan</label>
                  <textarea
                    placeholder="Tulis Pertanyaan di sini..."
                    className="w-full min-h-[100px] p-4 rounded-3xl border-2 border-black font-medium text-gray-700 focus:ring-0 focus:border-black placeholder:text-gray-300"
                    value={addForm.pertanyaan}
                    onChange={(e) => setAddForm({ ...addForm, pertanyaan: e.target.value })}
                  />
                </div>

                {/* --- INPUT DINAMIS --- */}
                {addForm.isMatrix ? (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Konfigurasi Matrix</h4>
                    <div className="space-y-4">
                      <input
                        placeholder="Kolom Kategori (Contoh: Benar;Salah)"
                        className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-black text-sm transition-all"
                        value={addForm.columns}
                        onChange={(e) => setAddForm({ ...addForm, columns: e.target.value })}
                      />
                      <textarea
                        placeholder="Daftar Pernyataan (Pisahkan dengan ; )"
                        className="w-full p-3 min-h-[80px] rounded-xl border-2 border-gray-100 focus:border-black text-sm transition-all"
                        value={addForm.sub_pertanyaan}
                        onChange={(e) => setAddForm({ ...addForm, sub_pertanyaan: e.target.value })}
                      />

                      {addForm.columns && addForm.sub_pertanyaan && (
                        <div className="mt-4 bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                          <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Tentukan Kunci Jawaban:</p>
                          <div className="space-y-3">
                            {addForm.sub_pertanyaan.split(";").map((p, pIdx) => (
                              <div key={pIdx} className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-gray-600 italic">"{p || `Pernyataan ${pIdx + 1}`}"</span>
                                <div className="flex flex-wrap gap-2">
                                  {addForm.columns.split(";").map((col, cIdx) => (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => {
                                        let jawArr = addForm.jawaban.split(";");
                                        while (jawArr.length < addForm.sub_pertanyaan.split(";").length) jawArr.push("");
                                        jawArr[pIdx] = col;
                                        setAddForm({ ...addForm, jawaban: jawArr.join(";") });
                                      }}
                                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${
                                        addForm.jawaban.split(";")[pIdx] === col ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300 shadow-sm"
                                      }`}
                                    >
                                      {col}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Opsi Jawaban</h4>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-primary border-2 border-black"
                          checked={addForm.multiple}
                          onChange={(e) => setAddForm({ ...addForm, multiple: e.target.checked, jawaban: "" })}
                        />
                        <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-black">Mode Kompleks</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      {addForm.opsi.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-gray-100 focus-within:border-black transition-all">
                          <input
                            type={addForm.multiple ? "checkbox" : "radio"}
                            name="kunci_add"
                            className="w-5 h-5 cursor-pointer accent-black"
                            checked={addForm.jawaban.split(";").includes(op) && op.trim() !== ""}
                            onChange={() => toggleJawabanSelection(addForm, setAddForm, op)}
                          />
                          <input
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                            placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                            value={op}
                            onChange={(e) => {
                              const newOpsi = [...addForm.opsi];
                              newOpsi[idx] = e.target.value;
                              setAddForm({ ...addForm, opsi: newOpsi });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t-2 border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Kunci Tersimpan</span>
                    <span className="text-xs font-bold text-black truncate max-w-[200px]">{addForm.jawaban || "-"}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowAddForm(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-all">
                      Batal
                    </button>
                    <button
                      onClick={handleCreate}
                      className="bg-[#FFD600] px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:bg-[#2196f3] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      Simpan Soal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* end form tambah soal */}

      {/* form edit soal */}
      {editingSoal && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm overflow-y-auto overflow-x-hidden">
          <div className="flex min-h-screen items-start justify-center p-4 py-12">
            <div className="bg-white w-full max-w-2xl p-8 rounded-[2.5rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative transition-all animate-in fade-in zoom-in duration-200">
              {/* Header Modal - Diseragamkan ke Kuning */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-[#FFD600] rounded-full border-2 border-black"></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-black">Edit Data Soal</h3>
                </div>
                <span className="text-[10px] font-black px-3 py-1 bg-gray-100 border-2 border-black rounded-full uppercase tracking-widest">ID: {editingSoal._id.slice(-6)}</span>
              </div>

              <div className="space-y-6">
                {/* Tipe Soal - Background diganti dari Emerald ke Gray-50 agar netral */}
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-black flex items-center gap-4">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest">Tipe Soal</label>
                  <select
                    className="flex-1 p-2 rounded-xl border-2 border-black font-bold text-sm bg-white cursor-pointer"
                    value={form.isMatrix ? "matrix" : "standar"}
                    onChange={(e) => {
                      const isMatrixTarget = e.target.value === "matrix";
                      const originalJawaban = editingSoal.jawaban;
                      let restoredJawaban = "";

                      if (isMatrixTarget === editingSoal.isMatrix) {
                        restoredJawaban = editingSoal.isMatrix ? Object.values(originalJawaban).join(";") : Array.isArray(originalJawaban) ? originalJawaban.join(";") : originalJawaban;
                      } else {
                        restoredJawaban = "";
                      }

                      setForm({
                        ...form,
                        isMatrix: isMatrixTarget,
                        jawaban: String(restoredJawaban),
                        opsi: isMatrixTarget ? [] : isMatrixTarget === editingSoal.isMatrix ? editingSoal.opsi : ["", "", "", ""],
                        columns: isMatrixTarget ? (isMatrixTarget === editingSoal.isMatrix ? editingSoal.columns.join(";") : "Benar;Salah") : "",
                        sub_pertanyaan: isMatrixTarget ? (isMatrixTarget === editingSoal.isMatrix ? editingSoal.sub_pertanyaan.map((s) => s.teks).join(";") : "") : "",
                        multiple: isMatrixTarget ? false : isMatrixTarget === editingSoal.isMatrix ? editingSoal.multiple : false,
                      });
                    }}
                  >
                    <option value="standar">Pilihan Ganda</option>
                    <option value="matrix">Matrix (Tabel)</option>
                  </select>
                </div>

                {/* Input Pertanyaan, Mapel, Stage (Sudah Seragam) */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Isi Pertanyaan</label>
                  <textarea
                    className="w-full min-h-[120px] p-4 rounded-3xl border-2 border-black font-medium text-gray-700 focus:ring-0 focus:border-black"
                    value={form.pertanyaan}
                    onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Mata Pelajaran</label>
                    <select className="w-full p-3 rounded-2xl border-2 border-black font-bold text-sm bg-white" value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })}>
                      <option value="bi">Bahasa Indonesia</option>
                      <option value="mtk">Matematika</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Stage</label>
                    <select
                      className="w-full p-3 rounded-2xl border-2 border-black font-bold text-sm bg-white"
                      value={form.stage}
                      onChange={(e) => setForm({ ...form, stage: Number(e.target.value) })}
                    >
                      <option value={1}>Stage 1</option>
                      <option value={2}>Stage 2</option>
                      <option value={3}>Stage 3</option>
                    </select>
                  </div>
                </div>

                {/* Konfigurasi Matrix - Warna Sky diganti ke Gray-50 agar seragam */}
                {form.isMatrix ? (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Konfigurasi Matrix</h4>

                    {/* Input untuk Edit Kolom (Kategori) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Kolom Kategori (Pisahkan dengan ;)</label>
                      <input
                        placeholder="Contoh: Benar;Salah"
                        className="w-full p-3 rounded-xl border-2 border-black focus:border-black text-sm bg-white"
                        value={form.columns}
                        onChange={(e) => setForm({ ...form, columns: e.target.value })}
                      />
                    </div>

                    {/* Input untuk Edit Daftar Pernyataan */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Daftar Pernyataan (Pisahkan dengan ;)</label>
                      <textarea
                        placeholder="Contoh: Pernyataan A;Pernyataan B"
                        className="w-full p-3 min-h-[100px] rounded-xl border-2 border-black focus:border-black text-sm bg-white"
                        value={form.sub_pertanyaan}
                        onChange={(e) => setForm({ ...form, sub_pertanyaan: e.target.value })}
                      />
                    </div>

                    {/* Visual Selector Kunci Jawaban Matrix */}
                    {form.columns && form.sub_pertanyaan && (
                      <div className="mt-4 bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Tentukan Kunci Jawaban:</p>
                        <div className="space-y-4">
                          {form.sub_pertanyaan.split(";").map((p, pIdx) => (
                            <div key={pIdx} className="flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-gray-600 italic">"{p || `Pernyataan ${pIdx + 1}`}"</span>
                              <div className="flex flex-wrap gap-2">
                                {form.columns.split(";").map((col, cIdx) => (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => {
                                      let jawArr = form.jawaban.split(";");
                                      // Pastikan panjang array sesuai dengan jumlah pernyataan
                                      while (jawArr.length < form.sub_pertanyaan.split(";").length) jawArr.push("");
                                      jawArr[pIdx] = col;
                                      setForm({ ...form, jawaban: jawArr.join(";") });
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${
                                      form.jawaban.split(";")[pIdx] === col
                                        ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        : "bg-white text-gray-400 border-gray-100 hover:border-black"
                                    }`}
                                  >
                                    {col}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Pilihan Ganda - Warna Ungu diganti ke Gray-50 */
                  <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Opsi Jawaban</h4>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs border-2 border-black"
                          checked={form.multiple}
                          onChange={(e) => setForm({ ...form, multiple: e.target.checked, jawaban: "" })}
                        />
                        <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-black">Mode Kompleks</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      {form.opsi.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-gray-100 focus-within:border-black transition-all">
                          <input
                            type={form.multiple ? "checkbox" : "radio"}
                            className="w-5 h-5 accent-black cursor-pointer"
                            checked={form.jawaban.split(";").includes(op) && op.trim() !== ""}
                            onChange={() => toggleJawabanSelection(form, setForm, op)}
                          />
                          <input
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                            value={op}
                            onChange={(e) => {
                              const newOpsi = [...form.opsi];
                              newOpsi[idx] = e.target.value;
                              setForm({ ...form, opsi: newOpsi });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Footer - Diganti ke Tema Hitam & Kuning */}
                <div className="mt-8 pt-6 border-t-2 border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Kunci Tersimpan</span>
                    <span className="text-xs font-bold text-black truncate max-w-[150px]">{form.jawaban || "-"}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditingSoal(null)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-all">
                      Batal
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="bg-[#FFD600] px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:bg-[#2196f3] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* end form edit soal */}

      {/* ---------------END MODAL ---------------*/}

      {/* PAGINATION */}
      <div className="mt-10 flex items-center justify-between bg-white p-6 rounded-[2rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">
          Halaman <span className="text-[#2196f3] text-lg mx-1">{page}</span> dari {totalPage}
        </p>

        <div className="flex gap-4">
          {/* Tombol PREV - Putih Border Hitam */}
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-[3px] border-black bg-white text-black disabled:opacity-30 disabled:grayscale active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            ← Prev
          </button>

          {/* Tombol NEXT - Biru Saweria */}
          <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            className="bg-[#2196f3] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-[3px] border-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>
      {/* END PAGINATION */}
    </div>
  );
}
