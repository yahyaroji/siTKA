import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-6 text-center">
      {/* Animasi / Ikon Besar */}
      <div className="relative mb-8">
        <h1 className="text-[120px] font-black text-emerald-600/10 leading-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl animate-bounce">🗺️</span>
        </div>
      </div>

      {/* Teks Utama */}
      <div className="max-w-md">
        <h2 className="text-3xl font-black text-emerald-900 mb-4">Waduh, Kamu Nyasar!</h2>
        <p className="text-base-content/60 mb-8 font-medium">Halaman yang kamu cari nggak ada di sini. Mungkin kamu salah ketik alamat, atau halaman ini sudah dipindahkan ke dimensi lain. 🌌</p>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate(-1)} className="btn btn-outline border-2 px-8 font-bold">
            ← Kembali
          </button>
          <button onClick={() => navigate("/siswa")} className="btn btn-primary px-8 text-white font-bold shadow-lg shadow-emerald-200">
            Ke Dashboard 🏠
          </button>
        </div>
      </div>

      {/* Footer Kecil */}
      <div className="mt-8 space-y-4 text-center">
        <div className="divider opacity-10 px-10"></div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-base-content/30 font-bold tracking-widest uppercase">Portal Try Out TKA &bull; TA 2025/2026</p>
          <p className="text-sm text-base-content/40 font-medium flex items-center gap-1">
            Build with <span className="animate-pulse text-blue-500">💙</span> by SMA Diponegoro TA
          </p>
        </div>
      </div>
    </div>
  );
}
