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
  const [filterRole, setFilterRole] = useState("siswa");
  const [searchQuery, setSearchQuery] = useState("");

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
      // Gabungkan semua data, dan pastikan 'role' terisi dengan benar
      // Jika user sedang di tab guru, kita pastikan 'nis' diisi dari value 'nip'
      const dataToSubmit = {
        ...form,
        role: filterRole,
        // Jika di DB hanya ada field 'nis', maka NIP guru kita masukkan ke 'nis'
        nis: filterRole === "guru" ? form.nip || form.nis : form.nis,
      };

      console.log("Data siap kirim:", dataToSubmit); // Intip dulu di console sebelum kirim

      if (editingSiswa) {
        await updateSiswa(editingSiswa._id, dataToSubmit); // Pakai dataToSubmit!
        Swal.fire("Berhasil", "Data berhasil diupdate", "success");
      } else {
        await createSiswa(dataToSubmit); // Pakai dataToSubmit!
        Swal.fire("Berhasil", "User berhasil ditambahkan", "success");
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error("Error Detail:", err.response?.data);
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

      // 2. Filter Pencarian Nama
      if (searchQuery && !item.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. Filter tambahan khusus jika role-nya siswa
      if (filterRole === "siswa") {
        if (filterSekolah && item.sekolah_asal !== filterSekolah) return false;
        if (filterVerified === "verified" && !(item.verifiedStage >= activeStage)) return false;
        if (filterVerified === "unverified" && item.verifiedStage >= activeStage) return false;
      }

      return true;
    });
  }, [data, filterRole, filterSekolah, filterVerified, activeStage, searchQuery]);

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

  if (loading)
    return (
      <div className="p-20 text-center">
        <span className="loading loading-spinner loading-lg text-[#FFD600]"></span>
        <p className="mt-4 font-black uppercase tracking-widest text-sm opacity-20">Memuat Data Siswa...</p>
      </div>
    );

  return (
    <div className="p-2">
      {/* HEADER & TABS: Gaya Pill Saweria */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-6">
        {/* Tab Stage / Role */}
        <div className="flex bg-black p-1.5 rounded-[1.5rem] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.1)] gap-1">
          {filterRole === "siswa" ? (
            [1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStage(s)}
                className={`px-8 py-2.5 rounded-2xl font-black text-[10px] uppercase transition-all tracking-widest ${
                  activeStage === s ? "bg-[#FFD600] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "text-white/40 hover:text-white"
                }`}
              >
                Stage {s}
              </button>
            ))
          ) : (
            <h2 className="px-6 py-2.5 text-[10px] font-black text-white uppercase tracking-[0.3em]">Manajemen Akun Guru</h2>
          )}
        </div>

        {/* Button Group: Aksi Utama */}
        <div className="flex items-center gap-4">
          {/* Tombol Tambah - Biru Saweria */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#2196f3] text-white px-6 py-3 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            + {filterRole === "siswa" ? "ADD STUDENT" : "ADD TEACHER"}
          </button>

          {filterRole === "siswa" && (
            <label className="bg-white text-black px-6 py-3 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
              IMPORT EXCEL
              <input type="file" hidden onChange={handleExcelUpload} accept=".xlsx, .xls" />
            </label>
          )}

          {/* Tombol Export - Kuning */}
          <button
            onClick={downloadExcel}
            className="bg-[#FFD600] text-black px-6 py-3 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            EXPORT DATA
          </button>
        </div>
      </div>

      {/* FILTER AREA: Bersih & Modern */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 bg-white p-8 rounded-[2.5rem] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] items-end">
        {/* 1. User Category - Kita kasih jatah 2 kolom */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">User Category</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 cursor-pointer outline-none"
          >
            <option value="siswa">👥 STUDENT</option>
            <option value="guru">👨‍🏫 TEACHER</option>
          </select>
        </div>

        {filterRole === "siswa" ? (
          <>
            {/* 2. School - 3 Kolom */}
            <div className="flex flex-col gap-2 md:col-span-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">School</span>
              <select
                value={filterSekolah}
                onChange={(e) => setFilterSekolah(e.target.value)}
                className="w-full bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 cursor-pointer outline-none"
              >
                <option value="">ALL SCHOOLS</option>
                {sekolahList.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Verification - 2 Kolom */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Status</span>
              <select
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value)}
                className="w-full bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">ALL</option>
                <option value="verified">✅ VERIFIED</option>
                <option value="unverified">❌ UNVERIFIED</option>
              </select>
            </div>

            {/* 4. Score - 2 Kolom */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Score</span>
              <select
                value={sortSkor}
                onChange={(e) => setSortSkor(e.target.value)}
                className="w-full bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 cursor-pointer outline-none"
              >
                <option value="none">DEFAULT</option>
                <option value="desc">HIGHEST</option>
                <option value="asc">LOWEST</option>
              </select>
            </div>

            {/* 5. Search Box - Sisa 3 Kolom */}
            <div className="flex flex-col gap-2 md:col-span-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Search Participant</span>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="NAME"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-[3px] border-black rounded-2xl px-5 py-3 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all outline-none"
                />
              </div>
            </div>
          </>
        ) : (
          // /* JIKA TEACHER: Kasih search yang panjang */
          <div className="flex flex-col gap-2 md:col-span-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Search Teacher</span>
            <input
              type="text"
              placeholder="SEARCH BY NIP OR NAME..."
              className="w-full bg-white border-[3px] border-black rounded-2xl px-5 py-3 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"
            />
          </div>
        )}
      </div>

      {/* TABLE: Clean Modern Style */}
      <div className="bg-white rounded-[2.5rem] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <table className="table w-full border-collapse">
          <thead>
            <tr className="bg-black text-white border-b-[3px] border-black">
              <th className="p-6 text-left font-black uppercase text-[10px] tracking-[0.2em]">Name</th>
              {filterRole === "siswa" ? (
                <>
                  <th className="p-6 text-left font-black uppercase text-[10px] tracking-[0.2em]">School</th>
                  {activeStage > 1 && <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-[#FFD600]">Score S{activeStage - 1}</th>}
                  <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em]">BI</th>
                  <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em]">Math</th>
                  <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-[#2196f3]">Total Score</th>
                  <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em]">Verified</th>
                </>
              ) : (
                <>
                  <th className="p-6 text-left font-black uppercase text-[10px] tracking-[0.2em]">NIP / ID</th>
                  <th className="p-6 text-left font-black uppercase text-[10px] tracking-[0.2em]">Email</th>
                  <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em]">Role</th>
                </>
              )}
              <th className="p-6 text-center font-black uppercase text-[10px] tracking-[0.2em]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y-[3px] divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((s) => {
                const result = getResultByStage(s, activeStage);
                const isVerified = s.verifiedStage >= activeStage;

                return (
                  <tr key={s._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="font-black text-black text-sm uppercase">{s.nama_lengkap}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {s._id.slice(-6)}</div>
                    </td>

                    {filterRole === "siswa" ? (
                      <>
                        <td className="p-5">
                          <span className="  text-[10px] font-black text-black uppercase">{s.sekolah_asal}</span>
                        </td>

                        {activeStage > 1 && (
                          <td className="p-5 text-center">
                            <span className="font-mono font-black text-sm text-black bg-yellow-100 px-3 py-1 rounded-lg border border-yellow-200">
                              {getResultByStage(s, activeStage - 1)?.skor ?? "0"}
                            </span>
                          </td>
                        )}

                        <td className="p-5 text-center font-mono font-bold text-gray-500">{result?.nilaiPerMapel?.bi ?? "-"}</td>
                        <td className="p-5 text-center font-mono font-bold text-gray-500">{result?.nilaiPerMapel?.mtk ?? "-"}</td>

                        <td className="p-5 text-center">
                          <span className="text-sm font-black text-[#2196f3] font-mono bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{result?.skor ?? "-"}</span>
                        </td>

                        <td className="p-5 text-center">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm border-2 border-black checked:bg-[#2196f3]"
                            checked={isVerified}
                            onChange={(e) => handleVerify(s._id, activeStage, e.target.checked)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-5 font-mono text-xs font-bold text-gray-400">{s.nis || "-"}</td>
                        <td className="p-5 font-bold text-gray-600 lowercase">{s.email}</td>
                        <td className="p-5 text-center">
                          <span className="bg-black text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">{s.role}</span>
                        </td>
                      </>
                    )}

                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-4">
                        <button onClick={() => handleOpenEdit(s)} className="text-[10px] font-black uppercase text-black hover:text-[#2196f3] transition-colors tracking-widest">
                          Edit
                        </button>
                        <div className="w-[1.5px] h-4 bg-black/20"></div>
                        <button onClick={() => handleDelete(s._id)} className="text-[10px] font-black uppercase text-gray-300 hover:text-red-500 transition-colors tracking-widest">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="p-20 text-center">
                  <div className="text-4xl mb-4">🏜️</div>
                  <p className="font-black text-gray-300 uppercase tracking-[0.3em]">Data Tidak Ditemukan</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-10 flex justify-between items-center bg-white p-6 rounded-[2rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-[10px] text-black uppercase tracking-[0.3em] ml-2">
          Halaman <span className="text-[#2196f3] text-lg mx-1">{currentPage}</span> dari {totalPages || 1}
        </span>

        <div className="flex gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="bg-white border-[3px] border-black rounded-2xl px-8 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-20 disabled:grayscale transition-all"
          >
            PREV
          </button>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="bg-[#FFD600] border-[3px] border-black rounded-2xl px-8 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-20 transition-all"
          >
            NEXT
          </button>
        </div>
      </div>

      {/* MODAL: Gaya Pop-up Saweria */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-black">
            <div className="bg-[#FFD600] p-6 text-black font-[900] text-center uppercase tracking-widest border-b-4 border-black">{editingSiswa ? "Update Data User" : "Tambah User Baru"}</div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input
                    className="input input-bordered rounded-xl font-bold bg-gray-50 focus:bg-white transition-all border-gray-200 outline-none"
                    value={form.nama_lengkap}
                    onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{form.role === "guru" ? "NIP" : "NISN"}</label>
                  <input
                    type="number"
                    className="input input-bordered rounded-xl font-bold bg-gray-50 transition-all border-gray-200 outline-none"
                    value={form.role === "guru" ? form.nip : form.nis}
                    onChange={(e) => setForm({ ...form, [form.role === "guru" ? "nip" : "nis"]: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Akun</label>
                  <select
                    className="select select-bordered rounded-xl font-bold bg-gray-50 border-gray-200 outline-none"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="siswa">Student</option>
                    <option value="guru">Teacher</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input
                  type="email"
                  className="input input-bordered rounded-xl font-bold bg-gray-50 transition-all border-gray-200 outline-none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              {form.role === "siswa" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School</label>
                  <input
                    className="input input-bordered rounded-xl font-bold bg-gray-50 transition-all border-gray-200 outline-none"
                    value={form.sekolah_asal}
                    onChange={(e) => setForm({ ...form, sekolah_asal: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  className="input input-bordered rounded-xl font-bold bg-gray-50 transition-all border-gray-200 outline-none"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingSiswa}
                  placeholder={editingSiswa ? "Kosongkan jika tetap" : ""}
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-gray-100 text-black rounded-2xl font-[900] text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                  BATAL
                </button>
                <button type="submit" className="flex-1 py-4 bg-black text-white rounded-2xl font-[900] text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD PROGRESS: Minimalist Kuning */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-md">
          <div className="bg-white p-10 rounded-[3rem] w-80 text-center shadow-2xl border-4 border-black">
            <span className="loading loading-ring loading-lg text-[#FFD600]"></span>
            <h3 className="font-black text-sm uppercase tracking-[0.2em] mt-6 mb-2">Importing...</h3>
            <p className="text-[10px] text-gray-400 mb-6 italic font-bold">Processing: {currentName}</p>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden border border-black/5">
              <div className="bg-[#FFD600] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#FFD600]" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-black font-black text-xl">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
