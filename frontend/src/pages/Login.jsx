import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { apiLogin } from "../api/authApi";
import Swal from "sweetalert2"; // Gunakan Swal untuk alert yang lebih manis

export default function Login() {
  const { login } = useContext(AuthContext);
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        {/* Logo atau Icon Atas */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white shadow-lg mb-4">
            <span className="text-3xl font-bold">🎯logooo</span>
          </div> */}
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight">Try Out TKA</h1>
          <p className="text-base-content/60 font-medium">Masuk untuk memulai ujian kamu</p>
        </div>

        {/* Card Form */}
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <form onSubmit={handleLogin} className="card-body gap-4">
            {/* Input NIS */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-emerald-800">Nomor Induk Siswa Nasional (NISN)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-40">🆔</span>
                <input
                  type="text"
                  placeholder="Masukkan NISN kamu"
                  className="input input-bordered w-full pl-10 focus:input-primary transition-all bg-base-200/50"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-emerald-800">Password</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-40">🔑</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10 focus:input-primary transition-all bg-base-200/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tombol Login */}
            <div className="form-control mt-4">
              <button type="submit" disabled={loading} className={`btn btn-primary text-white shadow-md border-none ${loading ? "loading" : ""}`}>
                {loading ? "Mencocokkan Data..." : "Masuk Sekarang"}
              </button>
            </div>

            {/* Footer Form */}
            <div className="text-center mt-4">
              <p className="text-[11px] opacity-50 uppercase font-bold tracking-widest">Lupa password? Hubungi Admin Sekolah</p>
            </div>
          </form>
        </div>

        {/* Info Tambahan */}
        {/* <p className="text-center mt-8 text-sm text-base-content/40 font-medium">&copy; 2024 Exam Portal — Made with ❤️ for Students</p> */}
      </div>
    </div>
  );
}
