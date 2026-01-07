import { useState, useMemo, useEffect } from "react";
import { getSiswaWithResult, verifySiswa, createSiswa, updateSiswa, deleteSiswa } from "../../api/guruService";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function TabelSiswa() {
  // --- STATE UTAMA ---
  const [activeStage, setActiveStage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");
  const [sortSkor, setSortSkor] = useState("desc");
  const [filterRole, setFilterRole] = useState("siswa"); // State Role

  // --- STATE UPLOAD EXCEL ---
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState("");

  // --- STATE CRUD & MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [form, setForm] = useState({
    nama_lengkap: "",
    nis: "",
    nip: "", // Field tambahan untuk Guru
    password: "",
    sekolah_asal: "",
    email: "",
    role: "siswa",
  });

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      // Pastikan backend getSiswaWithResult tidak memfilter role:siswa saja
      const res = await getSiswaWithResult();

      // LOG DEBUG: Cek di console (F12) apakah data guru ada di sini
      console.log("Data dari server:", res.data);

      setData(res.data || []);
    } catch {
      Swal.fire("Error", "Gagal memuat data dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStage]);

  // Reset pagination jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSekolah, filterVerified, sortSkor, activeStage, filterRole]);

  // --- HELPER ---
  const getResultByStage = (siswa, stage) => {
    return siswa.results?.find((r) => r.stage === stage);
  };

  // --- HANDLER CRUD ---
  const handleOpenEdit = (siswa) => {
    setEditingSiswa(siswa);
    setForm({
      nama_lengkap: siswa.nama_lengkap || "",
      nis: siswa.nis || "",
      nip: siswa.nip || "",
      password: "",
      sekolah_asal: siswa.sekolah_asal || "",
      email: siswa.email || "",
      role: siswa.role || "siswa",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSiswa(null);
    setForm({ nama_lengkap: "", nis: "", nip: "", password: "", sekolah_asal: "", email: "", role: "siswa" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSiswa) {
        await updateSiswa(editingSiswa._id, form);
        Swal.fire("Berhasil", "Data berhasil diupdate", "success");
      } else {
        await createSiswa(form);
        Swal.fire("Berhasil", "User berhasil ditambahkan", "success");
      }
      closeModal();
      loadData();
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus data ini?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus!",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteSiswa(id);
        loadData();
        Swal.fire("Terhapus", "Data berhasil dihapus", "success");
      } catch {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  };

  const handleVerify = async (userId, stage, checked) => {
    try {
      await verifySiswa(userId, { stage, checked });
      loadData();
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal update verifikasi", "error");
    }
  };

  // --- LOGIKA FILTER & SORT ---
  const sekolahList = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...new Set(data.filter((s) => s.role === "siswa").map((s) => s.sekolah_asal))];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Filter Role (Wajib sama dengan state filterRole)
      // Pastikan string "guru" atau "siswa" di DB sama persis (case sensitive)
      if (item.role !== filterRole) return false;

      // 2. Filter tambahan khusus jika role-nya siswa
      if (filterRole === "siswa") {
        if (filterSekolah && item.sekolah_asal !== filterSekolah) return false;
        if (filterVerified === "verified" && !(item.verifiedStage >= activeStage)) return false;
        if (filterVerified === "unverified" && item.verifiedStage >= activeStage) return false;
      }

      return true;
    });
  }, [data, filterRole, filterSekolah, filterVerified, activeStage]);

  const sortedData = useMemo(() => {
    if (sortSkor === "none" || filterRole === "guru") return filteredData;

    return [...filteredData].sort((a, b) => {
      const stageReferens = activeStage > 1 ? activeStage - 1 : activeStage;
      const skorA = getResultByStage(a, stageReferens)?.skor ?? 0;
      const skorB = getResultByStage(b, stageReferens)?.skor ?? 0;
      return sortSkor === "desc" ? skorB - skorA : skorA - skorB;
    });
  }, [filteredData, sortSkor, activeStage, filterRole]);

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  // --- EXCEL HANDLERS ---
  const downloadExcel = () => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, `Data`);
    XLSX.writeFile(workbook, `Data_Export.xlsx`);
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
        text: `Import ${rows.length} siswa?`,
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
          await createSiswa({ ...row, role: "siswa" });
          successCount++;
        } catch (err) {
          console.error(err);
        }
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }
      setIsUploading(false);
      setProgress(0);
      Swal.fire("Selesai", `${successCount} data berhasil diimport`, "success");
      loadData();
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-10 text-center text-emerald-600 font-bold">Loading Data...</div>;

  return (
    <div className="p-4">
      {/* HEADER & TABS */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex gap-2">
          {filterRole === "siswa" &&
            [1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStage(s)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${activeStage === s ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                Stage {s}
              </button>
            ))}
          {filterRole === "guru" && <h2 className="text-xl font-bold text-emerald-800 tracking-tight">Daftar Akun Guru</h2>}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium">
            + {filterRole === "siswa" ? "Siswa" : "Guru"} Manual
          </button>
          {filterRole === "siswa" && (
            <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition font-medium">
              Import Excel
              <input type="file" hidden onChange={handleExcelUpload} accept=".xlsx, .xls" />
            </label>
          )}
          <button onClick={downloadExcel} className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition font-medium">
            Export Excel
          </button>
        </div>
      </div>

      {/* FILTER AREA */}
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kategori User</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border rounded-lg p-2 bg-white font-semibold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="siswa">👥 Siswa</option>
            <option value="guru">👨‍🏫 Guru</option>
          </select>
        </div>

        {filterRole === "siswa" && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Asal Sekolah</span>
              <select value={filterSekolah} onChange={(e) => setFilterSekolah(e.target.value)} className="border rounded-lg p-2 bg-white outline-none">
                <option value="">Semua Sekolah</option>
                {sekolahList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Status Verifikasi</span>
              <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className="border rounded-lg p-2 bg-white outline-none">
                <option value="all">Semua Status</option>
                <option value="verified">Terverifikasi</option>
                <option value="unverified">Belum Verifikasi</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Urutan Nilai</span>
              <select value={sortSkor} onChange={(e) => setSortSkor(e.target.value)} className="border rounded-lg p-2 bg-white outline-none">
                <option value="none">Default</option>
                <option value="desc">Nilai Tertinggi</option>
                <option value="asc">Nilai Terendah</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="">
            <tr className="bg-emerald-100 text-emerald-900 border-b-2 border-emerald-200">
              <th className="p-4 font-bold">Nama</th>
              {filterRole === "siswa" ? (
                <>
                  <th className="p-4 font-bold">Sekolah</th>
                  {activeStage > 1 && <th className="p-4 font-bold text-blue-600 text-center">Skor S{activeStage - 1}</th>}
                  <th className="p-4 font-bold text-center">BI</th>
                  <th className="p-4 font-bold text-center">MTK</th>
                  <th className="p-4 font-bold text-center">Total</th>
                  <th className="p-4 font-bold text-center">Verif</th>
                </>
              ) : (
                <>
                  <th className="p-4 font-bold">NIP / ID</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold text-center">Status</th>
                </>
              )}
              <th className="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((s) => {
                const result = getResultByStage(s, activeStage);
                const prevResult = activeStage > 1 ? getResultByStage(s, activeStage - 1) : null;
                return (
                  // <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <tr
                    key={s._id}
                    className={`border-b border-gray-100 transition-all duration-200 ${
                      s.verifiedStage >= activeStage
                        ? "bg-emerald-50/50 hover:bg-emerald-100/50" // Warna hijau tipis jika sudah verif
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-4 font-medium text-gray-800">{s.nama_lengkap}</td>
                    {filterRole === "siswa" ? (
                      <>
                        <td className="p-4 text-gray-600 text-sm">{s.sekolah_asal}</td>
                        {activeStage > 1 && <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/50">{prevResult?.skor ?? "0"}</td>}
                        <td className="p-4 text-center">{result?.nilaiPerMapel?.bi ?? "-"}</td>
                        <td className="p-4 text-center">{result?.nilaiPerMapel?.mtk ?? "-"}</td>
                        <td className="p-4 text-center font-black text-emerald-600">{result?.skor ?? "-"}</td>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-emerald-600"
                            checked={s.verifiedStage >= activeStage}
                            disabled={!!result}
                            onChange={(e) => handleVerify(s._id, activeStage, e.target.checked)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Pakai s.nis karena di JSON guru kamu key-nya adalah "nis" */}
                        <td className="p-4 font-mono text-sm">{s.nis || "-"}</td>
                        <td className="p-4 text-gray-600">{s.email}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">{s.role}</span>
                        </td>
                      </>
                    )}
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button onClick={() => handleOpenEdit(s)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="p-10 text-center text-gray-400 italic">
                  Data tidak ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-6 flex justify-center items-center gap-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-100 transition">
          Prev
        </button>
        <span className="font-bold text-sm text-gray-600 uppercase tracking-widest">
          Halaman {currentPage} dari {totalPages || 1}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-100 transition"
        >
          Next
        </button>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-600 p-4 text-white font-bold text-center uppercase tracking-wider">{editingSiswa ? "Update Data User" : "Tambah User Baru"}</div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
                  <input
                    className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={form.nama_lengkap}
                    onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{form.role === "guru" ? "NIP" : "NISN"}</label>
                  <input
                    className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={form.role === "guru" ? form.nip : form.nis}
                    onChange={(e) => setForm({ ...form, [form.role === "guru" ? "nip" : "nis"]: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Role Akun</label>
                  <select className="border p-2 rounded-lg outline-none bg-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                <input
                  type="email"
                  className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              {form.role === "siswa" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Asal Sekolah</label>
                  <input
                    className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={form.sekolah_asal}
                    onChange={(e) => setForm({ ...form, sekolah_asal: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Password {editingSiswa && "(Kosongkan jika tetap)"}</label>
                <input
                  type="password"
                  className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingSiswa}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">
                  BATAL
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg">
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD PROGRESS MODAL */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-80 text-center shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Importing Data...</h3>
            <p className="text-xs text-gray-400 mb-4 italic">Memproses: {currentName}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-emerald-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-emerald-600 font-black">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
