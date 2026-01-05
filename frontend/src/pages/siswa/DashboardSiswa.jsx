import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { getProfile } from "../../api/siswaService";
import { getMyResult, startExam, getActiveSession } from "../../api/examApi";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";

export default function DashboardSiswa() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profileData = await getProfile(user.id);
        setProfile(profileData);

        const resResult = await getMyResult();
        setResults(resResult.data);

        const resActive = await getActiveSession();
        if (resActive && resActive.sessionId) {
          setActiveSession(resActive);
          localStorage.setItem("examSessionId", resActive.sessionId);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          return;
        }
        console.error("Gagal ambil data dahsboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchData();
  }, [user]);

  const hasDoneStage = (stage) => results.some((r) => r.stage === stage);

  const downloadSertifikat = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Path gambar di folder public (tanpa kata public)
    const imgData = "/template_sertif_stage1.png";

    // 1. Background Template
    doc.addImage(imgData, "PNG", 0, 0, 297, 210);

    // 2. Nama Siswa
    const namaSiswa = profile?.nama_lengkap?.toUpperCase() || "";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(27); // Ukuran font
    doc.setTextColor(0, 0, 0); // Warna hitam pekat agar elegan

    // Koordinat 148.5 adalah tengah-tengah kertas A4 Landscape
    // Koordinat 118 adalah posisi tinggi
    doc.text(namaSiswa, 148.5, 118, { align: "center" });

    // 3. Download
    doc.save(`Sertifikat_${namaSiswa}.pdf`);
  };

  const handleStart = async (stage) => {
    try {
      if (activeSession && activeSession.stage === stage) {
        navigate(`/ujian/${activeSession.sessionId}`);
        return;
      }

      // Konfirmasi sebelum mulai
      const confirm = await Swal.fire({
        title: `Mulai Tahap ${stage}?`,
        text: "Waktu akan langsung berjalan setelah kamu menekan tombol mulai.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        confirmButtonText: "Ya, Gas!",
        cancelButtonText: "Nanti dulu",
      });

      if (confirm.isConfirmed) {
        const res = await startExam(stage);
        localStorage.setItem("examSessionId", res.sessionId);
        navigate(`/ujian/${res.sessionId}`);
      }
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal memulai ujian", "error");
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Mau keluar ?",
      text: "Pastikan semua ujianmu sudah selesai atau tersimpan ya!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Emerald
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Keluar!",
      cancelButtonText: "Gak Jadi",
    }).then((result) => {
      if (result.isConfirmed) {
        // Hapus semua data di localStorage
        localStorage.clear();
        // Redirect
        window.location.href = "/login";
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-ring loading-lg text-primary"></span>
          <p className="font-bold text-emerald-800 animate-pulse">Menyiapkan Dashboard-mu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pb-12">
      {/* HEADER / NAVBAR */}
      <div className="bg-emerald-600 text-white pb-24 pt-10 px-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Baris Atas: Nama & Logout */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Halo, {profile?.nama_lengkap.split(" ")[0]}! 👋</h1>
              <p className="opacity-80 text-sm md:text-base">Selamat datang di Portal Try Out TKA.</p>
            </div>

            {/* TOMBOL LOGOUT */}
            <button onClick={handleLogout} className="btn btn-sm md:btn-md bg-white/20 hover:bg-red-500 border-none text-white gap-2 transition-all">
              <span>Keluar</span>
              <span className="hidden md:inline">➡️</span>
            </button>
          </div>

          {/* Baris Bawah: NIS (Responsive) */}
          <div className="bg-emerald-500/50 backdrop-blur-sm p-3 rounded-2xl border border-emerald-400 w-full md:w-fit">
            <p className="text-[10px] font-bold uppercase opacity-70">Nomor Induk Siswa</p>
            <p className="text-lg md:text-xl font-mono font-bold tracking-widest italic leading-tight">{profile?.nis}</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto -mt-16 px-6">
        {/* INFO PROFILE CARD */}
        <div className="card bg-base-100 shadow-xl border border-base-300 mb-8">
          <div className="card-body p-5 md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="avatar placeholder">
                <div className="bg-emerald-100 text-emerald-700 rounded-full w-12 md:w-16 shadow-inner ring-2 ring-emerald-50">
                  <span className="text-xl md:text-2xl font-bold">👦</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-bold text-emerald-900 leading-tight">{profile?.nama_lengkap}</h2>
                <p className="text-xs md:text-sm opacity-60 font-medium lowercase">{profile?.sekolah_asal}</p>
              </div>
            </div>

            {/* Badge status di sisi kanan/bawah */}
            {/* <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
              <div className="badge badge-primary badge-sm md:badge-md font-bold">SISWA</div>
              <div className="badge badge-outline badge-sm md:badge-md opacity-70">AKTIF</div>
            </div> */}
          </div>
        </div>

        {/* STAGE LIST */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2 mb-4">Daftar Ujian Tahap</h3>

          <StageCard
            stage={1}
            title="Tryout TKA Tahap 1"
            result={results.find((r) => r.stage === 1)}
            // Tambahkan pengecekan verifikasi admin di sini
            enabled={profile?.isVerifiedByAdmin === true && profile?.verifiedStage >= 1 && !hasDoneStage(1)}
            activeSession={activeSession?.stage === 1 ? activeSession : null}
            onStart={() => handleStart(1)}
            // Sesuaikan teks jika belum diverifikasi
            disabledText={hasDoneStage(1) ? "Sudah dikerjakan" : "Tunggu Verifikasi Admin ⏳"}
            onDownload={downloadSertifikat}
          />

          <StageCard
            stage={2}
            title="Tryout TKA Tahap 2"
            result={results.find((r) => r.stage === 2)}
            enabled={profile?.isVerifiedByAdmin === true && profile?.verifiedStage >= 2 && !hasDoneStage(2)}
            activeSession={activeSession?.stage === 2 ? activeSession : null}
            onStart={() => handleStart(2)}
            disabledText={hasDoneStage(2) ? "Sudah dikerjakan" : "Belum Dibuka 🔒"}
          />

          <StageCard
            stage={3}
            title="Tryout TKA Tahap 3"
            result={results.find((r) => r.stage === 3)}
            enabled={profile?.isVerifiedByAdmin === true && profile?.verifiedStage >= 3 && !hasDoneStage(3)}
            activeSession={activeSession?.stage === 3 ? activeSession : null}
            disabledText={hasDoneStage(3) ? "Sudah dikerjakan" : "Belum Dibuka 🔒"}
            // disabledText="Belum Dibuka 🔒"
            onStart={() => handleStart(3)}
          />
        </div>
      </div>
    </div>
  );
}

function StageCard({ stage, title, result, enabled, onStart, disabledText, activeSession, onDownload }) {
  const canClick = enabled || activeSession;

  return (
    <div
      className={`card bg-base-100 border transition-all duration-300 shadow-sm
      ${activeSession ? "border-warning bg-amber-50 ring-2 ring-warning ring-offset-2" : "border-base-300 hover:border-emerald-300"}
      ${!canClick && !result ? "opacity-60 grayscale" : "opacity-100"}
    `}
    >
      <div className="card-body p-5 md:flex-row justify-between items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{stage}</span>
            <h3 className="text-lg font-bold text-base-content">{title}</h3>
            {activeSession && <span className="badge badge-warning animate-pulse font-bold text-[10px]">LIVE</span>}
          </div>

          {result ? (
            <div className="mt-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-emerald-600">Hasil Akhir</span>
                {/* <span className="text-lg font-black text-emerald-700">{result.skor}</span> */}
              </div>
              <div className="flex gap-4">
                <div className="text-[11px]">
                  <span className="font-bold text-blue-700">BI: {result.nilaiPerMapel?.bi || 0}</span>
                  <span className="ml-2 opacity-60">
                    ✅{result.detailPerMapel?.bi?.benar} ❌{result.detailPerMapel?.bi?.salah}
                  </span>
                </div>
                <div className="text-[11px]">
                  <span className="font-bold text-pink-700">MTK: {result.nilaiPerMapel?.mtk || 0}</span>
                  <span className="ml-2 opacity-60">
                    ✅{result.detailPerMapel?.mtk?.benar} ❌{result.detailPerMapel?.mtk?.salah}
                  </span>
                </div>
              </div>
              {/* TOMBOL DOWNLOAD (Hanya muncul jika Stage 1 selesai) */}
              {stage === 1 && (
                <button onClick={() => onDownload(result)} className="mt-3 btn btn-xs btn-outline btn-emerald text-emerald-700 normal-case">
                  📜 Unduh Sertifikat
                </button>
              )}
            </div>
          ) : activeSession ? (
            <p className="text-sm text-warning font-bold flex items-center gap-1 mt-1">
              <span>⚠️</span> Selesaikan ujian yang tertunda!
            </p>
          ) : (
            <p className="text-sm opacity-50 mt-1">{enabled ? "Ujian tersedia, silahkan kerjakan." : "Status: " + disabledText}</p>
          )}
        </div>

        <div className="w-full md:w-auto">
          <button
            disabled={!canClick}
            onClick={onStart}
            className={`btn w-full md:w-48 text-white shadow-md
               ${activeSession ? "btn-warning" : enabled ? "btn-primary" : "btn-disabled"}`}
          >
            {activeSession ? "Lanjutkan Ujian 🔄" : result ? "Selesai ✨" : enabled ? "Mulai Ujian ✍️" : "Terkunci"}
          </button>
        </div>
      </div>
    </div>
  );
}
