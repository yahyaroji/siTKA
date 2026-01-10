import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerSiswaMandiri } from "../api/guruService";
import { DAFTAR_SEKOLAH } from "../utils/daftarSekolah";
import Swal from "sweetalert2";

const Register = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nis: "",
    email: "",
    password: "",
    sekolah_asal: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const filteredSekolah = DAFTAR_SEKOLAH.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()));
  const [loading, setLoading] = useState(false);

  // Handle perubahan setiap input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle proses submit form
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   // setMsg("");

  //   try {
  //     const response = await registerSiswaMandiri(formData);
  //     alert(response.data.message);
  //     // Jika berhasil, arahkan ke halaman login
  //     navigate("/login");
  //   } catch (error) {
  //     if (error.response) {
  //       // setMsg(error.response.data.message);
  //     } else {
  //       // setMsg("Gagal terhubung ke server");
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Tampilkan Loading ala-ala SweetAlert2
    Swal.fire({
      title: "Sedang Memproses...",
      html: `
      <div className="flex flex-col items-center">
        <p className="mb-4 text-sm">Sabar ya, Gess! Lagi nyimpen data dan nyiapin email buat kamu... 🚀</p>
      </div>
    `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading(); // Ini yang bikin ada spinner muter-muter
      },
    });

    try {
      // 2. Eksekusi Register
      const response = await registerSiswaMandiri(formData);

      // 3. Jika Berhasil, tampilkan pesan sukses
      // response.data.message biasanya berisi "Pendaftaran berhasil, cek email..."
      await Swal.fire({
        icon: "success",
        title: "Mantap, Berhasil! 🎉",
        text: response.data.message || "Pendaftaran sukses! Segera cek Inbox atau folder Spam email kamu ya.",
        confirmButtonColor: "#10b981", // Warna Emerald
        confirmButtonText: "Siap, Gaskeun!",
      });

      // 4. Tutup modal & pindah ke login
      const modalToggle = document.getElementById("modal-register");
      if (modalToggle) modalToggle.checked = false;
      navigate("/login");
    } catch (error) {
      // 5. Jika Gagal (NIS duplikat, email salah, atau server bapuk)
      const pesanError = error.response?.data?.message || "Waduh, koneksi lagi bermasalah. Coba lagi ya!";

      Swal.fire({
        icon: "error",
        title: "Daftar Gagal 🤯",
        text: pesanError,
        confirmButtonColor: "#ef4444", // Warna Merah
        confirmButtonText: "Oke, Perbaiki",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-emerald-900 tracking-tight">Formulir Pendaftaran Try Out TKA</h2>
        <p className="text-sm text-base-content/50 mt-1 font-medium">Isi data kamu dengan benar ya, Gess!</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        {/* Baris 1: Nama Lengkap */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-emerald-800">Nama Lengkap</span>
          </label>
          <input
            type="text"
            name="nama_lengkap"
            value={formData.nama_lengkap}
            onChange={handleChange}
            placeholder="Nama sesuai raport..."
            className="input input-bordered focus:input-primary w-full bg-base-200/40"
            required
          />
        </div>

        {/* Baris 2: NIS (Username) */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-emerald-800">NISN</span>
          </label>
          <input
            type="number"
            name="nis"
            value={formData.nis}
            onChange={handleChange}
            placeholder="Nomor Induk Siswa Nasional"
            className="input input-bordered focus:input-primary w-full bg-base-200/40"
            required
          />
        </div>

        {/* Baris 3: Email */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-emerald-800">Email Aktif</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="akun@gmail.com"
            className="input input-bordered focus:input-primary w-full bg-base-200/40"
            required
          />
          {/* <div className="label">
            <span className="label-text-alt text-emerald-600 italic font-small">📩 User & Password bakal dikirim ke sini!</span>
          </div> */}
        </div>

        {/* Baris 4: Password */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-emerald-800">Buat Password Login</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 6 karakter"
              className="input input-bordered focus:input-primary w-full bg-base-200/40 text-sm pr-10"
              required
            />
            <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-40 hover:opacity-100 transition-opacity" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
          {/* <div className="label py-1">
            <span className="label-text-alt text-emerald-600 italic font-small">*Ingat baik-baik password ini yaa!</span>
          </div> */}
        </div>

        {/* Baris 5: Asal Sekolah (Autocomplete) */}
        <div className="form-control w-full relative">
          <label className="label">
            <span className="label-text font-bold text-emerald-800">Asal Sekolah (SMP/MTs)</span>
          </label>
          <input
            type="text"
            placeholder="Cari sekolahmu..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
              setFormData({ ...formData, sekolah_asal: e.target.value });
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="input input-bordered focus:input-primary w-full bg-base-200/40"
            required={!formData.sekolah_asal}
          />

          {/* Dropdown List */}
          {showDropdown && searchTerm && (
            <ul className="absolute left-0 top-[100%] z-[100] w-full mt-2 p-2 shadow-2xl bg-base-100 border border-base-200 rounded-2xl max-h-48 overflow-y-auto overflow-x-hidden">
              {filteredSekolah.length > 0 ? (
                filteredSekolah.map((sekolah, index) => (
                  <li
                    key={index}
                    className="p-3 cursor-pointer hover:bg-emerald-600 hover:text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2 mb-1"
                    onClick={() => {
                      setSearchTerm(sekolah);
                      setFormData({ ...formData, sekolah_asal: sekolah });
                      setShowDropdown(false);
                    }}
                  >
                    🏫 {sekolah}
                  </li>
                ))
              ) : (
                <li className="p-4 text-xs text-base-content/60 bg-base-200/50 rounded-xl leading-relaxed">
                  Sekolah nggak ketemu? <br />
                  <span className="text-emerald-700 font-black">Lanjut ketik manual aja, aman kok! ✅</span>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Tombol Daftar */}
        <div className="form-control mt-6">
          <button type="submit" disabled={loading} className="btn btn-primary text-white border-none shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
            {loading ? <span className="loading loading-spinner"></span> : "Gaskeun, Datar Sekarang!"}
          </button>
        </div>

        <p className="text-[10px] text-center opacity-30 font-black tracking-widest uppercase mt-4">SMA Diponegoro Tulungagung</p>
      </form>
    </div>
  );
};

export default Register;
