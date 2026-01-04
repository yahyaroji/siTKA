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
    if (!form.jawaban.trim()) return "Jawaban tidak boleh kosong";

    if (form.isMatrix) {
      if (!form.columns.trim() || !form.sub_pertanyaan.trim()) {
        return "Kolom dan Sub-pertanyaan Matrix wajib diisi";
      }
      const colArr = form.columns.split(";").map((c) => c.trim());
      const subArr = form.sub_pertanyaan.split(";").map((s) => s.trim());
      const jawArr = form.jawaban.split(";").map((j) => j.trim());

      if (subArr.length !== jawArr.length) {
        return `Jumlah jawaban (${jawArr.length}) harus sama dengan jumlah pernyataan (${subArr.length})`;
      }

      // Cek apakah jawaban ada di dalam list columns
      for (const j of jawArr) {
        if (!colArr.some((c) => c.toLowerCase() === j.toLowerCase())) {
          return `Jawaban "${j}" tidak ditemukan di daftar kolom (${form.columns})`;
        }
      }
    } else {
      // Validasi Pilihan Ganda / Multiple
      const opsi = form.opsi.map((o) => o.trim()).filter(Boolean);
      const jawabanArr = form.multiple ? form.jawaban.split(";").map((j) => j.trim()) : [form.jawaban.trim()];

      for (const j of jawabanArr) {
        if (!opsi.some((o) => o.toLowerCase() === j.toLowerCase())) {
          return `Jawaban "${j}" tidak ada di opsi`;
        }
      }

      if (!form.multiple && jawabanArr.length > 1) {
        return "Soal ini tidak boleh memiliki lebih dari satu jawaban";
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

      {/* form tambah soal nanti dibuat modal */}

      {showAddForm && (
        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
          <h3>Tambah Soal Baru</h3>

          {/* Pilihan Tipe Soal */}
          <div style={{ marginBottom: "15px" }}>
            <label>Tipe Soal: </label>
            <select value={addForm.isMatrix ? "matrix" : "standar"} onChange={(e) => setAddForm({ ...addForm, isMatrix: e.target.value === "matrix" })}>
              <option value="standar">Pilihan Ganda / Multiple</option>
              <option value="matrix">Matrix (Tabel)</option>
            </select>
          </div>

          <textarea placeholder="Pertanyaan" style={{ width: "100%", marginBottom: "10px" }} value={addForm.pertanyaan} onChange={(e) => setAddForm({ ...addForm, pertanyaan: e.target.value })} />

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <select value={addForm.mapel} onChange={(e) => setAddForm({ ...addForm, mapel: e.target.value })}>
              <option value="bi">Bahasa Indonesia</option>
              <option value="mtk">Matematika</option>
            </select>

            <select value={addForm.stage} onChange={(e) => setAddForm({ ...addForm, stage: Number(e.target.value) })}>
              <option value={1}>Stage 1</option>
              <option value={2}>Stage 2</option>
              <option value={3}>Stage 3</option>
            </select>
          </div>

          <hr />

          {/* Input Dinamis Berdasarkan Tipe Soal */}
          {addForm.isMatrix ? (
            <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: "5px" }}>
              <h4>Pengaturan Matrix</h4>
              <input placeholder="Kolom: Benar;Salah" style={{ width: "100%", marginBottom: "5px" }} value={addForm.columns} onChange={(e) => setAddForm({ ...addForm, columns: e.target.value })} />
              <textarea
                placeholder="Pernyataan: Pernyataan 1;Pernyataan 2"
                style={{ width: "100%" }}
                value={addForm.sub_pertanyaan}
                onChange={(e) => setAddForm({ ...addForm, sub_pertanyaan: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <h4>Opsi Jawaban</h4>
              {addForm.opsi.map((op, idx) => (
                <input
                  key={idx}
                  style={{ width: "100%", marginBottom: "5px" }}
                  placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                  value={op}
                  onChange={(e) => {
                    const newOpsi = [...addForm.opsi];
                    newOpsi[idx] = e.target.value;
                    setAddForm({ ...addForm, opsi: newOpsi });
                  }}
                />
              ))}
              <label>
                <input type="checkbox" checked={addForm.multiple} onChange={(e) => setAddForm({ ...addForm, multiple: e.target.checked })} />
                {" Multiple Jawaban"}
              </label>
            </div>
          )}

          {/* Input Jawaban Benar */}
          <div style={{ marginTop: "15px" }}>
            <label>
              <b>Kunci Jawaban</b>
            </label>
            <input
              style={{ width: "100%", display: "block", marginTop: "5px" }}
              placeholder={addForm.isMatrix ? "Contoh: Benar;Salah;Benar" : "Contoh: Opsi A;Opsi B"}
              value={addForm.jawaban}
              onChange={(e) => setAddForm({ ...addForm, jawaban: e.target.value })}
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handleCreate} style={{ marginRight: "10px" }}>
              Simpan
            </button>
            <button onClick={() => setShowAddForm(false)}>Batal</button>
          </div>
        </div>
      )}

      {/* end form tambah soal nanti dibuat modal */}

      {/* form edit soal */}
      {editingSoal && (
        <div className="modal-edit">
          <h3>Edit Soal</h3>

          {/* Toggle Tipe Soal */}
          <div style={{ marginBottom: "15px", padding: "10px", background: "#f0f0f0", borderRadius: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Tipe Soal: </label>
            <select value={form.isMatrix ? "matrix" : "standar"} onChange={(e) => setForm({ ...form, isMatrix: e.target.value === "matrix" })}>
              <option value="standar">Pilihan Ganda / Multiple</option>
              <option value="matrix">Matrix (Tabel)</option>
            </select>
          </div>

          {/* Pertanyaan */}
          <div>
            <label>Pertanyaan</label>
            <br />
            <textarea style={{ width: "100%", minHeight: "80px" }} value={form.pertanyaan} onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })} />
          </div>

          {/* Mapel & Stage */}
          <div style={{ display: "flex", gap: "20px", margin: "10px 0" }}>
            <div>
              <label>Mapel</label>
              <br />
              <select value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })}>
                <option value="bi">Bahasa Indonesia</option>
                <option value="mtk">Matematika</option>
              </select>
            </div>
            <div>
              <label>Stage</label>
              <br />
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: Number(e.target.value) })}>
                <option value={1}>Stage 1</option>
                <option value={2}>Stage 2</option>
                <option value={3}>Stage 3</option>
              </select>
            </div>
          </div>

          <hr />

          {/* INPUT KONDISIONAL: MATRIX VS STANDAR */}
          {form.isMatrix ? (
            /* --- TAMPILAN KHUSUS MATRIX --- */
            <div style={{ background: "#e8f4fd", padding: "10px", borderRadius: "5px" }}>
              <h4>Pengaturan Matrix</h4>
              <div>
                <label>Kolom Kategori (Pisahkan dengan ;)</label>
                <input style={{ width: "100%" }} placeholder="Contoh: Benar;Salah atau Fakta;Opini" value={form.columns} onChange={(e) => setForm({ ...form, columns: e.target.value })} />
              </div>
              <div style={{ marginTop: "10px" }}>
                <label>Daftar Pernyataan (Pisahkan dengan ;)</label>
                <textarea
                  style={{ width: "100%" }}
                  placeholder="Contoh: Pernyataan 1;Pernyataan 2;Pernyataan 3"
                  value={form.sub_pertanyaan}
                  onChange={(e) => setForm({ ...form, sub_pertanyaan: e.target.value })}
                />
              </div>
            </div>
          ) : (
            /* --- TAMPILAN STANDAR (PG/MULTIPLE) --- */
            <div>
              <h4>Opsi Jawaban</h4>
              {form.opsi.map((op, idx) => (
                <div key={idx} style={{ marginBottom: "5px" }}>
                  <input
                    style={{ width: "100%" }}
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
              <div style={{ marginTop: "10px" }}>
                <label>
                  <input type="checkbox" checked={form.multiple} onChange={(e) => setForm({ ...form, multiple: e.target.checked })} />
                  {"Multiple Jawaban (Siswa bisa pilih > 1)"}
                </label>
              </div>
            </div>
          )}

          {/* JAWABAN BENAR (Berlaku untuk keduanya, tapi placeholder beda) */}
          <div style={{ marginTop: "15px", padding: "10px", border: "1px dashed #ccc" }}>
            <label style={{ fontWeight: "bold" }}>Kunci Jawaban</label>
            <br />
            <input
              style={{ width: "100%", border: "1px solid blue" }}
              placeholder={form.isMatrix ? "Urutan jawaban sesuai pernyataan (Contoh: Benar;Salah;Benar)" : "Gunakan ; jika multiple"}
              value={form.jawaban}
              onChange={(e) => setForm({ ...form, jawaban: e.target.value })}
            />
            {form.isMatrix && <small style={{ color: "gray" }}>*Pastikan jumlah jawaban sama dengan jumlah pernyataan</small>}
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handleUpdate} style={{ background: "green", color: "white", padding: "5px 15px", marginRight: "10px" }}>
              Simpan Perubahan
            </button>
            <button onClick={() => setEditingSoal(null)}>Batal</button>
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
