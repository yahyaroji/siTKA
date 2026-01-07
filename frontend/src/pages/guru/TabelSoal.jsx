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
    <div>
      {/* modal untuk upload soal excel */}
      {showUploadModal && (
        <div>
          <div>
            <h3>Upload Soal via Excel</h3>

            <input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files[0])} />

            <div style={{ marginTop: 10 }}>
              <button onClick={handleUploadExcel} disabled={!excelFile || uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setExcelFile(null);
                }}
                style={{ marginLeft: 10 }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* end modal untuk upload soal excel */}

      {/* form tambah soal dibuat modal */}
      {showAddForm && (
        <div style={{ border: "2px solid #3b82f6", padding: "20px", borderRadius: "12px", marginBottom: "30px", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
          <h3 style={{ color: "#1e40af", marginTop: 0 }}>Tambah Soal Baru</h3>

          {/* Pilihan Tipe Soal */}
          <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "bold" }}>Tipe Soal: </label>
            <select
              style={{ padding: "5px", borderRadius: "4px" }}
              value={addForm.isMatrix ? "matrix" : "standar"}
              onChange={(e) => setAddForm({ ...addForm, isMatrix: e.target.value === "matrix", jawaban: "" })}
            >
              <option value="standar">Pilihan Ganda / Multiple</option>
              <option value="matrix">Matrix (Tabel)</option>
            </select>
          </div>

          <textarea
            placeholder="Tulis Pertanyaan di sini..."
            style={{ width: "100%", minHeight: "80px", marginBottom: "10px", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
            value={addForm.pertanyaan}
            onChange={(e) => setAddForm({ ...addForm, pertanyaan: e.target.value })}
          />

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Mata Pelajaran</label>
              <select style={{ width: "100%", padding: "8px" }} value={addForm.mapel} onChange={(e) => setAddForm({ ...addForm, mapel: e.target.value })}>
                <option value="bi">Bahasa Indonesia</option>
                <option value="mtk">Matematika</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Stage</label>
              <select style={{ width: "100%", padding: "8px" }} value={addForm.stage} onChange={(e) => setAddForm({ ...addForm, stage: Number(e.target.value) })}>
                <option value={1}>Stage 1</option>
                <option value={2}>Stage 2</option>
                <option value={3}>Stage 3</option>
              </select>
            </div>
          </div>

          <hr style={{ border: "0.5px solid #eee", marginBottom: "20px" }} />

          {/* --- INPUT DINAMIS --- */}
          {addForm.isMatrix ? (
            /* UI UNTUK MATRIX */
            <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#475569" }}>Konfigurasi Matrix</h4>
              <label style={{ fontSize: "11px", fontWeight: "bold" }}>Kolom Kategori (Pisahkan dengan ; )</label>
              <input
                placeholder="Contoh: Benar;Salah"
                style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                value={addForm.columns}
                onChange={(e) => setAddForm({ ...addForm, columns: e.target.value })}
              />

              <label style={{ fontSize: "11px", fontWeight: "bold" }}>Daftar Pernyataan (Pisahkan dengan ; )</label>
              <textarea
                placeholder="Contoh: Matahari terbit dari timur;Ikan bernapas dengan paru-paru"
                style={{ width: "100%", padding: "8px", minHeight: "60px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                value={addForm.sub_pertanyaan}
                onChange={(e) => setAddForm({ ...addForm, sub_pertanyaan: e.target.value })}
              />

              {/* Visual Selector Kunci Matrix */}
              {addForm.columns && addForm.sub_pertanyaan && (
                <div style={{ marginTop: "15px", backgroundColor: "#fff", padding: "10px", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px" }}>Pilih Kunci Jawaban:</p>
                  {addForm.sub_pertanyaan.split(";").map((p, pIdx) => (
                    <div key={pIdx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", flex: 1 }}>{p || `Pernyataan ${pIdx + 1}`}</span>
                      <div style={{ display: "flex", gap: "5px" }}>
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
                            style={{
                              padding: "4px 10px",
                              fontSize: "11px",
                              cursor: "pointer",
                              borderRadius: "4px",
                              border: "1px solid #e2e8f0",
                              backgroundColor: addForm.jawaban.split(";")[pIdx] === col ? "#10b981" : "#f1f5f9",
                              color: addForm.jawaban.split(";")[pIdx] === col ? "white" : "#1e293b",
                            }}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* UI UNTUK PILIHAN GANDA / MULTIPLE */
            <div style={{ background: "#f0f9ff", padding: "15px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#0369a1" }}>Opsi Jawaban</h4>
              <p style={{ fontSize: "11px", color: "#0c4a6e", marginBottom: "10px" }}>*Isi teks opsi, lalu klik lingkaran/kotak untuk jadi kunci.</p>

              {addForm.opsi.map((op, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type={addForm.multiple ? "checkbox" : "radio"}
                    name="kunci_add"
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    checked={addForm.jawaban.split(";").includes(op) && op.trim() !== ""}
                    onChange={() => toggleJawabanSelection(addForm, setAddForm, op)}
                  />
                  <input
                    style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                    placeholder={`Teks Opsi ${String.fromCharCode(65 + idx)}`}
                    value={op}
                    onChange={(e) => {
                      const newOpsi = [...addForm.opsi];
                      newOpsi[idx] = e.target.value;
                      setAddForm({ ...addForm, opsi: newOpsi });
                    }}
                  />
                </div>
              ))}

              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "15px", cursor: "pointer" }}>
                <input type="checkbox" style={{ width: "16px", height: "16px" }} checked={addForm.multiple} onChange={(e) => setAddForm({ ...addForm, multiple: e.target.checked, jawaban: "" })} />
                <span style={{ fontWeight: "bold", fontSize: "13px", color: "#0369a1" }}>Mode Jawaban Kompleks (Multiple)</span>
              </label>
            </div>
          )}

          {/* Ringkasan Kunci Jawaban (Otomatis) */}
          <div style={{ marginTop: "20px", padding: "12px", background: "#f1f5f9", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Kunci Jawaban yang tersimpan:</label>
            <div style={{ color: "#2563eb", fontWeight: "bold", fontSize: "14px", marginTop: "4px" }}>
              {addForm.jawaban || <span style={{ color: "#94a3b8", fontWeight: "normal" }}>Belum ada kunci dipilih</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "25px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={() => setShowAddForm(false)} style={{ padding: "8px 20px", borderRadius: "6px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}>
              Batal
            </button>
            <button onClick={handleCreate} style={{ padding: "8px 25px", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>
              Simpan Soal
            </button>
          </div>
        </div>
      )}

      {/* end form tambah soal dibuat modal */}

      {/* form edit soal */}
      {editingSoal && (
        <div
          className="modal-edit"
          style={{ border: "2px solid #10b981", padding: "20px", borderRadius: "12px", marginBottom: "30px", backgroundColor: "#fff", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "#065f46", margin: 0 }}>Edit Soal</h3>
            <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", background: "#f0fdf4", color: "#10b981", fontWeight: "bold", border: "1px solid #10b981" }}>
              ID: {editingSoal._id.slice(-6)}
            </span>
          </div>

          {/* Dropdown Tipe Soal dengan Logic Reset & Restore */}
          <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#f0fdf4", borderRadius: "8px" }}>
            <label style={{ fontWeight: "bold", color: "#065f46" }}>Tipe Soal: </label>
            <select
              style={{ padding: "6px", borderRadius: "6px", border: "1px solid #10b981", outline: "none" }}
              value={form.isMatrix ? "matrix" : "standar"}
              onChange={(e) => {
                const isMatrixTarget = e.target.value === "matrix";

                // 1. Ambil jawaban asli dari database untuk backup
                const originalJawaban = editingSoal.jawaban;

                // 2. Logic Konversi Jawaban agar tidak Error .split()
                let restoredJawaban = "";
                if (isMatrixTarget === editingSoal.isMatrix) {
                  // Jika balik ke tipe asli soal ini
                  restoredJawaban = editingSoal.isMatrix ? Object.values(originalJawaban).join(";") : Array.isArray(originalJawaban) ? originalJawaban.join(";") : originalJawaban;
                } else {
                  // Jika pindah ke tipe yang baru/berbeda dari database
                  restoredJawaban = "";
                }

                setForm({
                  ...form,
                  isMatrix: isMatrixTarget,
                  // Pastikan jawaban SELALU STRING di dalam form state
                  jawaban: String(restoredJawaban),
                  opsi: isMatrixTarget ? [] : isMatrixTarget === editingSoal.isMatrix ? editingSoal.opsi : ["", "", "", ""],
                  columns: isMatrixTarget ? (isMatrixTarget === editingSoal.isMatrix ? editingSoal.columns.join(";") : "Benar;Salah") : "",
                  sub_pertanyaan: isMatrixTarget ? (isMatrixTarget === editingSoal.isMatrix ? editingSoal.sub_pertanyaan.map((s) => s.teks).join(";") : "") : "",
                  multiple: isMatrixTarget ? false : isMatrixTarget === editingSoal.isMatrix ? editingSoal.multiple : false,
                });
              }}
            >
              <option value="standar">Pilihan Ganda / Multiple Choice</option>
              <option value="matrix">Matrix (Tabel)</option>
            </select>
          </div>

          {/* Area Pertanyaan */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#374151" }}>Isi Pertanyaan</label>
            <textarea
              style={{ width: "100%", minHeight: "100px", marginTop: "5px", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", lineHeight: "1.5" }}
              value={form.pertanyaan}
              onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })}
            />
          </div>

          {/* Pengaturan Mapel & Stage */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Mata Pelajaran</label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "5px" }}
                value={form.mapel}
                onChange={(e) => setForm({ ...form, mapel: e.target.value })}
              >
                <option value="bi">Bahasa Indonesia</option>
                <option value="mtk">Matematika</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Stage Pelaksanaan</label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "5px" }}
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: Number(e.target.value) })}
              >
                <option value={1}>Stage 1</option>
                <option value={2}>Stage 2</option>
                <option value={3}>Stage 3</option>
              </select>
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", marginBottom: "20px" }} />

          {/* --- INPUT KONDISIONAL --- */}
          {form.isMatrix ? (
            /* UI MATRIX */
            <div style={{ background: "#f0f9ff", padding: "15px", borderRadius: "10px", border: "1px solid #bae6fd" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#0369a1", display: "flex", alignItems: "center", gap: "5px" }}>⚙️ Pengaturan Matrix</h4>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "#0369a1" }}>Kolom Kategori (Pisahkan dengan ;)</label>
                <input
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  placeholder="Benar;Salah"
                  value={form.columns}
                  onChange={(e) => setForm({ ...form, columns: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "#0369a1" }}>Daftar Pernyataan (Pisahkan dengan ;)</label>
                <textarea
                  style={{ width: "100%", padding: "10px", minHeight: "80px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  placeholder="Pernyataan 1;Pernyataan 2"
                  value={form.sub_pertanyaan}
                  onChange={(e) => setForm({ ...form, sub_pertanyaan: e.target.value })}
                />
              </div>

              {/* Visual Selector Matrix */}
              {form.columns && form.sub_pertanyaan && (
                <div style={{ marginTop: "15px", backgroundColor: "#fff", padding: "12px", borderRadius: "8px", border: "1px dashed #bae6fd" }}>
                  <p style={{ fontSize: "12px", fontWeight: "bold", color: "#0369a1", marginBottom: "10px" }}>Tentukan Kunci Jawaban:</p>
                  {form.sub_pertanyaan.split(";").map((p, pIdx) => (
                    <div
                      key={pIdx}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "10px", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}
                    >
                      <span style={{ fontSize: "13px", color: "#475569", flex: 1 }}>{p || `Baris ${pIdx + 1}`}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {form.columns.split(";").map((col, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              let jawArr = form.jawaban.split(";");
                              while (jawArr.length < form.sub_pertanyaan.split(";").length) jawArr.push("");
                              jawArr[pIdx] = col;
                              setForm({ ...form, jawaban: jawArr.join(";") });
                            }}
                            style={{
                              padding: "5px 12px",
                              fontSize: "11px",
                              cursor: "pointer",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              transition: "all 0.2s",
                              backgroundColor: form.jawaban.split(";")[pIdx] === col ? "#0ea5e9" : "#f8fafc",
                              color: form.jawaban.split(";")[pIdx] === col ? "white" : "#64748b",
                              fontWeight: form.jawaban.split(";")[pIdx] === col ? "bold" : "normal",
                            }}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* UI STANDAR / MULTIPLE */
            <div style={{ background: "#fdfaff", padding: "15px", borderRadius: "10px", border: "1px solid #e9d5ff" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#6b21a8", display: "flex", alignItems: "center", gap: "5px" }}>📝 Opsi Jawaban</h4>
              {form.opsi.map((op, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type={form.multiple ? "checkbox" : "radio"}
                    name="kunci_edit"
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    checked={form.jawaban.split(";").filter(Boolean).includes(op) && op.trim() !== ""}
                    onChange={() => toggleJawabanSelection(form, setForm, op)}
                  />
                  <input
                    style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                    value={op}
                    onChange={(e) => {
                      const newOpsi = [...form.opsi];
                      newOpsi[idx] = e.target.value;
                      setForm({ ...form, opsi: newOpsi });
                    }}
                  />
                </div>
              ))}

              <div style={{ marginTop: "15px", padding: "10px", background: "#f5f3ff", borderRadius: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: "18px", height: "18px" }} checked={form.multiple} onChange={(e) => setForm({ ...form, multiple: e.target.checked, jawaban: "" })} />
                  <span style={{ fontWeight: "bold", fontSize: "14px", color: "#6b21a8" }}>Mode Multiple Jawaban (Jawaban Kompleks)</span>
                </label>

                {/* Indikator Aturan Skor BE */}
                {form.multiple && (
                  <div style={{ marginTop: "10px", padding: "8px", borderLeft: "4px solid #ef4444", background: "#fef2f2" }}>
                    <p style={{ fontSize: "11px", margin: 0, color: "#b91c1c" }}>
                      ⚠️ <strong>Aturan Skor:</strong> Maks 3 jawaban benar & tidak boleh memilih semua opsi (Poin akan 0).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Kunci Jawaban Saat Ini */}
          <div style={{ marginTop: "20px", padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>Kunci Jawaban Aktif:</label>
            <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "16px", marginTop: "5px", wordBreak: "break-all" }}>
              {form.jawaban || <span style={{ color: "#9ca3af", fontWeight: "normal" }}>Belum ada kunci dipilih</span>}
            </div>
          </div>

          {/* Buttons Action */}
          <div style={{ marginTop: "25px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              onClick={() => setEditingSoal(null)}
              style={{ padding: "10px 25px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#4b5563", fontWeight: "bold", cursor: "pointer" }}
            >
              Batal
            </button>
            <button
              onClick={handleUpdate}
              style={{
                padding: "10px 30px",
                borderRadius: "8px",
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.4)",
              }}
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}
      {/* form edit soal sampai sini */}

      <h2>Manajemen Soal</h2>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <select value={mapel} onChange={(e) => setMapel(e.target.value)}>
          <option value="">Semua Mapel</option>
          <option value="bi">Bahasa Indonesia</option>
          <option value="mtk">Matematika</option>
        </select>

        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">Semua Stage</option>
          <option value="1">Stage 1</option>
          <option value="2">Stage 2</option>
          <option value="3">Stage 3</option>
        </select>
        <button onClick={() => setShowAddForm(true)}>+ Tambah Soal</button>
        <button onClick={() => setShowUploadModal(true)}>Upload Soal (Excel)</button>
      </div>

      <p>Total soal: {data.length}</p>

      {/* Table */}
      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Mapel</th>
            <th>Stage</th>
            <th>Pertanyaan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s._id}>
              <td>{s.mapel}</td>
              <td>{s.stage}</td>
              <td>{s.pertanyaan}</td>
              <td>
                <button onClick={() => handleEdit(s)}>Edit</button> <button onClick={() => handleDelete(s._id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: 12 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span style={{ margin: "0 10px" }}>
          {page} / {totalPage}
        </span>

        <button disabled={page === totalPage} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
