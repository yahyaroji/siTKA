import { useState, useMemo, useEffect } from "react";
import { getSiswaWithResult, verifySiswa, createSiswa, updateSiswa, deleteSiswa } from "../../api/guruService";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function TabelSiswa() {
  // --- STATE LAMA ---
  const [activeStage, setActiveStage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");
  const [sortSkor, setSortSkor] = useState("desc");

  //upload excel
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState("");

  // --- STATE BARU (CRUD & MODAL) ---
  const [showModal, setShowModal] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [form, setForm] = useState({
    nama_lengkap: "",
    nis: "",
    password: "",
    sekolah_asal: "",
    email: "",
    role: "",
  });

  // --- STATE BARU (PAGINATION) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [activeStage]);

  // Reset ke halaman 1 jika filter berubah agar tidak bingung
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSekolah, filterVerified, sortSkor, activeStage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSiswaWithResult();
      setData(res.data);
    } catch {
      alert("Gagal memuat data siswa");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER CRUD ---
  const handleOpenEdit = (siswa) => {
    setEditingSiswa(siswa);
    setForm({
      nama_lengkap: siswa.nama_lengkap,
      nis: siswa.nis,
      password: "", // Kosongkan password demi keamanan
      sekolah_asal: siswa.sekolah_asal,
      email: siswa.email,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSiswa(null);
    setForm({ nama_lengkap: "", nis: "", password: "", sekolah_asal: "", email: "", role: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSiswa) {
        await updateSiswa(editingSiswa._id, form);
      } else {
        await createSiswa(form);
      }
      closeModal();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memproses data");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus data siswa ini? Semua hasil ujian juga akan hilang.")) {
      try {
        await deleteSiswa(id);
        loadData();
      } catch {
        alert("Gagal menghapus siswa");
      }
    }
  };

  // const handleExcelUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   try {
  //     await uploadSiswaExcel(formData);
  //     alert("Import Excel Berhasil");
  //     loadData();
  //   } catch {
  //     alert("Gagal upload Excel. Periksa format file.");
  //   }
  // };

  // --- LOGIKA FILTER & SORT (LAMA) ---
  const handleVerify = async (userId, stage, checked) => {
    try {
      await verifySiswa(userId, { stage, checked });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal update verifikasi");
    }
  };

  const getResultByStage = (siswa, stage) => {
    return siswa.results?.find((r) => r.stage === stage);
  };

  const sekolahList = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...new Set(data.map((s) => s.sekolah_asal))];
  }, [data]);

  const filteredData = data.filter((s) => {
    if (filterSekolah && s.sekolah_asal !== filterSekolah) return false;
    if (filterVerified === "verified" && !(s.verifiedStage >= activeStage)) return false;
    if (filterVerified === "unverified" && s.verifiedStage >= activeStage) return false;
    return true;
  });

  // const sortedData = useMemo(() => {
  //   if (sortSkor === "none") return filteredData;
  //   return [...filteredData].sort((a, b) => {
  //     const skorA = getResultByStage(a, activeStage)?.skor ?? 0;
  //     const skorB = getResultByStage(b, activeStage)?.skor ?? 0;
  //     return sortSkor === "desc" ? skorB - skorA : skorA - skorB;
  //   });
  // }, [filteredData, sortSkor, activeStage]);

  const sortedData = useMemo(() => {
    if (sortSkor === "none") return filteredData;

    return [...filteredData].sort((a, b) => {
      // LOGIKA ADAPTIF:
      // Jika activeStage > 1 (misal Stage 2), maka ambil skor dari activeStage - 1 (Stage 1).
      // Jika activeStage === 1, tetap ambil skor Stage 1.
      const stageReferens = activeStage > 1 ? activeStage - 1 : activeStage;

      const skorA = getResultByStage(a, stageReferens)?.skor ?? 0;
      const skorB = getResultByStage(b, stageReferens)?.skor ?? 0;

      if (sortSkor === "desc") {
        return skorB - skorA;
      } else {
        return skorA - skorB;
      }
    });
  }, [filteredData, sortSkor, activeStage]);

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const downloadExcel = () => {
    // Tetap menggunakan sortedData (Seluruh data), bukan currentData (Hanya 20)
    const excelData = sortedData.map((s) => {
      const result = getResultByStage(s, activeStage);
      return {
        "Nama Lengkap": s.nama_lengkap,
        "Sekolah Asal": s.sekolah_asal,
        "Nilai BI": result?.nilaiPerMapel?.bi ?? "-",
        "Nilai MTK": result?.nilaiPerMapel?.mtk ?? "-",
        "Total Skor": result?.skor ?? "-",
        "Status Verifikasi": s.verifiedStage >= activeStage ? "Terverifikasi" : "Belum",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Stage ${activeStage}`);
    XLSX.writeFile(workbook, `Data_Siswa_Stage_${activeStage}.xlsx`);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

      if (rows.length === 0) return Swal.fire("Error", "File Excel kosong!", "error");

      const confirm = await Swal.fire({
        title: "Konfirmasi",
        text: `Import ${rows.length} siswa dan kirim email akun?`,
        icon: "question",
        showCancelButton: true,
      });

      if (!confirm.isConfirmed) {
        e.target.value = null;
        return;
      }

      setIsUploading(true);
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setCurrentName(row.nama_lengkap || row.nama);
        try {
          // Panggil createSiswa dari guruService
          await createSiswa(row);
          successCount++;
        } catch (err) {
          console.error("Gagal:", err);
        }
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setIsUploading(false);
      setProgress(0);
      setCurrentName("");
      e.target.value = null;

      Swal.fire("Selesai", `${successCount} siswa berhasil diimport`, "success");
      loadData(); // Refresh tabel setelah selesai
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* TABS & ACTION BUTTONS */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setActiveStage(s)}
              style={{
                marginRight: 10,
                padding: "8px 14px",
                background: activeStage === s ? "#4f46e5" : "#ddd",
                color: activeStage === s ? "white" : "black",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Stage {s}
            </button>
          ))}
        </div>

        {/* <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ padding: "8px 14px", background: "#4f46e5", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            + Siswa Manual
          </button>
          <label style={{ padding: "8px 14px", background: "#6366f1", color: "white", borderRadius: 6, cursor: "pointer" }}>
            Import Excel
            <input type="file" hidden onChange={handleExcelUpload} accept=".xlsx, .xls" />
          </label>
          <button onClick={downloadExcel} style={{ padding: "8px 16px", background: "#10b981", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
            Export ke Excel
          </button>
        </div> */}

        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Tombol Manual */}
            <button onClick={() => setShowModal(true)} style={{ padding: "8px 14px", background: "#4f46e5", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
              + Siswa Manual
            </button>

            {/* Tombol Import Excel */}
            <label
              style={{
                padding: "8px 14px",
                background: isUploading ? "#94a3b8" : "#6366f1",
                color: "white",
                borderRadius: 6,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? `Memproses ${progress}%` : "Import Excel"}
              <input type="file" hidden onChange={handleExcelUpload} accept=".xlsx, .xls" disabled={isUploading} />
            </label>

            {/* Tombol Export */}
            <button onClick={downloadExcel} style={{ padding: "8px 16px", background: "#10b981", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              Export ke Excel
            </button>
          </div>

          {/* Progress Bar Halus di bawah tombol */}
          {isUploading && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "11px", color: "#6366f1", marginBottom: "4px", fontWeight: "500" }}>Mengirim akun: {currentName}</div>
              <div style={{ width: "100%", background: "#e2e8f0", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progress}%`,
                    background: "#6366f1",
                    height: "100%",
                    transition: "width 0.4s ease-in-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", padding: 25, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginTop: 0 }}>{editingSiswa ? "Edit Data Siswa" : "Tambah Siswa Baru"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Nama Lengkap" value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} required />
              <input placeholder="NISN" type="number" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} required />
              <input
                placeholder={editingSiswa ? "Kosongkan jika tidak ganti" : "Password"}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingSiswa}
              />
              <input placeholder="Sekolah Asal" value={form.sekolah_asal} onChange={(e) => setForm({ ...form, sekolah_asal: e.target.value })} required />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {/* <input placeholder="role" type="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /> */}
              <select
                value={form.role || "siswa"} // Default ke siswa jika state kosong
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ padding: "8px", marginBottom: "10px" }}
                required
              >
                <option value="siswa">Siswa</option>
                <option value="guru">Guru</option>
              </select>
              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 10, background: "#4f46e5", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  Simpan
                </button>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: 10, background: "#ef4444", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTER AREA */}
      <div style={{ marginBottom: 16 }}>
        <select value={filterSekolah} onChange={(e) => setFilterSekolah(e.target.value)}>
          <option value="">Semua Sekolah</option>
          {sekolahList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="all">Semua Status</option>
          <option value="verified">Terverifikasi</option>
          <option value="unverified">Belum Verifikasi</option>
        </select>
        {/* <select value={sortSkor} onChange={(e) => setSortSkor(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="none">Urutkan Skor</option>
          <option value="desc">Skor Tertinggi</option>
          <option value="asc">Skor Terendah</option>
        </select> */}

        <select value={sortSkor} onChange={(e) => setSortSkor(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="none">Urutkan Skor</option>
          <option value="desc">{activeStage > 1 ? `Skor S${activeStage - 1} Tertinggi` : "Skor Tertinggi"}</option>
          <option value="asc">{activeStage > 1 ? `Skor S${activeStage - 1} Terendah` : "Skor Terendah"}</option>
        </select>
      </div>

      {/* TABLE */}
      <table border="1" cellPadding="8" width="100%" style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th>Nama</th>
            <th>Sekolah</th>
            {/* Kolom Referensi Nilai Stage Sebelumnya */}
            {activeStage > 1 && <th style={{ color: "#6366f1" }}>Skor S{activeStage - 1}</th>}
            <th>BI</th>
            <th>MTK</th>
            <th>Total</th>
            <th>Verifikasi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {currentData.length > 0 ? (
            currentData.map((s) => {
              const result = getResultByStage(s, activeStage);
              // Ambil skor stage sebelumnya untuk referensi
              const prevResult = activeStage > 1 ? getResultByStage(s, activeStage - 1) : null;
              return (
                <tr key={s._id}>
                  <td>{s.nama_lengkap}</td>
                  <td>{s.sekolah_asal}</td>

                  {/* Tampilkan Skor Stage Sebelumnya jika aktif di Stage 2 atau 3 */}
                  {activeStage > 1 && (
                    <td align="center" style={{ fontWeight: "bold", background: "#fef2f2" }}>
                      {prevResult?.skor ?? "0"}
                    </td>
                  )}

                  <td align="center">{result?.nilaiPerMapel?.bi ?? "-"}</td>
                  <td align="center">{result?.nilaiPerMapel?.mtk ?? "-"}</td>
                  <td align="center">{result?.skor ?? "-"}</td>
                  <td align="center">
                    <input type="checkbox" checked={s.verifiedStage >= activeStage} disabled={!!result} onChange={(e) => handleVerify(s._id, activeStage, e.target.checked)} />
                  </td>
                  <td align="center">
                    <button onClick={() => handleOpenEdit(s)} style={{ marginRight: 5, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(s._id)} style={{ color: "red", cursor: "pointer" }}>
                      Hapus
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" align="center">
                Data tidak ditemukan
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PAGINATION NAV */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 15 }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: "5px 12px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
          Previous
        </button>
        <span style={{ fontWeight: "600" }}>
          Halaman {currentPage} dari {totalPages || 1}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
          style={{ padding: "5px 12px", cursor: currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
