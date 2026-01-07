import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { apiLogin } from "../api/authApi";
import Swal from "sweetalert2"; // Gunakan Swal untuk alert yang lebih manis

export default function Login() {
  const { login } = useContext(AuthContext);
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    setLoading(true);

    try {
      const data = await apiLogin(nis, password);

      if (data.user && data.token) {
        login(data.user, data.token);

        // Pesan sukses singkat sebelum pindah
        Swal.fire({
          icon: "success",
          title: "Login Berhasil!",
          text: `Selamat datang kembali, ${data.user.nama_lengkap}!`,
          showConfirmButton: false,
          timer: 1500,
        });

        setTimeout(() => {
          window.location.href = data.user.role === "siswa" ? "/siswa" : "/guru";
        }, 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: data.message || "NIS atau Password salah",
          confirmButtonColor: "#10b981",
        });
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan pada server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Tetap Sama */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight">Try Out TKA</h1>
          <p className="text-base-content/60 font-medium">Masuk untuk memulai ujian kamu</p>
        </div>

        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <form onSubmit={handleLogin} className="card-body gap-4">
            {/* Input NISN */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-emerald-800">Nomor Induk Siswa Nasional (NISN)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">🆔</span>
                <input
                  type="text"
                  placeholder="Masukkan NISN kamu"
                  className="input input-bordered w-full pl-10 focus:outline-emerald-500 transition-all bg-base-200/30"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password dengan fitur Mata */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-emerald-800">Password</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg">🔑</span>
                <input
                  type={showPassword ? "text" : "password"} // Dinamis tergantung state
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10 pr-10 focus:outline-emerald-500 transition-all bg-base-200/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Tombol Mata */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {/* Tombol Login */}
            <div className="form-control mt-4">
              <button
                type="submit"
                disabled={loading}
                className={`btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-none transition-all
                  ${loading ? "opacity-70" : "active:scale-95"}`}
              >
                {loading ? <span className="loading loading-spinner"></span> : "Masuk Sekarang"}
              </button>
            </div>

            {/* Pesan Lupa Password Kecil */}
            <div className="text-center mt-2">
              <span className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">Pastikan NISN & Password sesuai dengan email yang diterima</span>
            </div>
          </form>
        </div>

        {/* Footer Section (Sudah sesuai kode kamu) */}
        <div className="mt-8 space-y-4 text-center">
          <p className="text-sm text-base-content/60">
            Kesulitan masuk?{" "}
            <a href="https://wa.me/6285707701166?text=Halo%20Helpdesk,%0ANama/Username:%0AKendala:" target="_blank" className="text-emerald-600 font-bold hover:underline italic">
              Hubungi Admin IT
            </a>
          </p>
          <div className="divider opacity-10 px-10"></div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-base-content/30 font-bold tracking-widest uppercase">Portal Try Out TKA &bull; TA 2025/2026</p>
            <p className="text-sm text-base-content/40 font-medium flex items-center gap-1">
              Build with <span className="animate-pulse text-blue-500">💙</span> by SMA Diponegoro TA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
