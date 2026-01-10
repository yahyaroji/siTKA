import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { apiLogin } from "../api/authApi";
import Swal from "sweetalert2";
import Register from "./Register";

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
      <div className="max-w-md w-full animate-fadeIn">
        {/* HEADER SECTION */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-emerald-900 tracking-tighter">
            si<span className="text-emerald-600">TKA</span>
          </h1>
          <p className="text-base-content/50 font-medium mt-1">Sistem Informasi Try Out TKA </p>
        </div>

        {/* LOGIN CARD */}
        <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-visible">
          <form onSubmit={handleLogin} className="card-body gap-3 p-8">
            {/* Input NISN */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-emerald-800 text-xs uppercase tracking-wider">NISN</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">🆔</span>
                <input
                  type="number"
                  placeholder="Masukkan NISN"
                  className="input input-bordered w-full pl-10 focus:input-primary transition-all bg-base-200/20 border-base-300"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-emerald-800 text-xs uppercase tracking-wider">Password</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">🔑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10 pr-10 focus:input-primary transition-all bg-base-200/20 border-base-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-40 hover:opacity-100 transition-opacity" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {/* Tombol Login */}
            <div className="form-control mt-4">
              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary text-white shadow-lg border-none transition-all hover:scale-[1.02] active:scale-95
                ${loading ? "opacity-70" : ""}`}
              >
                {loading ? <span className="loading loading-spinner"></span> : "Masuk Sekarang"}
              </button>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
              <p className="text-[11px] text-center text-emerald-800 font-medium leading-relaxed">
                Gunakan NISN & Password yang telah terdaftar di sistem.
                {/* <span className="block opacity-70 text-[10px] mt-1 font-normal italic">(Detail akun dikirim otomatis ke Email setelah pendaftaran)</span> */}
              </p>
            </div>
            {/* DIVIDER & DAFTAR MANDIRI */}
            <div className="divider text-[10px] opacity-40 uppercase font-bold mt-4">Atau</div>

            <div className="text-center">
              <p className="text-sm text-base-content/60">
                Belum punya akun?{" "}
                <label htmlFor="modal-register" className="cursor-pointer text-emerald-600 font-bold hover:underline underline-offset-4 decoration-2">
                  Daftar Sekarang
                </label>
              </p>
            </div>
          </form>
        </div>
        {/* END LOGIN CARD */}

        {/* FOOTER SECTION */}
        <div className="mt-8 text-center space-y-4">
          <a
            href="https://wa.me/6285707701166?text=Halo%20Helpdesk,%0ANama%20Lengkap:%0AKendala:"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-base-300 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-all"
          >
            <span></span> Kesulitan login? Chat di sini
          </a>

          <div className="flex flex-col items-center gap-1 pt-4">
            <p className="text-[11px] font-medium opacity-60 flex items-center gap-1.5 justify-center">
              build with
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 text-[10px]">💙</span>
              </span>
              by SMA DIPONEGORO TA
            </p>
          </div>
        </div>
        {/* END FOOTER SECTION */}

        {/* MODAL REGISTER */}
        <input type="checkbox" id="modal-register" className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box w-11/12 max-w-2xl border border-emerald-500/20 shadow-2xl">
            <label htmlFor="modal-register" className="btn btn-sm btn-circle absolute right-4 top-4 bg-base-200 border-none">
              ✕
            </label>
            <div className="py-2">
              <Register isModal={true} />
            </div>
          </div>
          <label className="modal-backdrop" htmlFor="modal-register">
            Close
          </label>
        </div>
        {/* END MODAL REGISTER */}
      </div>
    </div>
  );
}
