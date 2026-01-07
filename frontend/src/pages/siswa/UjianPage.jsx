// src/pages/siswa/UjianPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/examApi";
import Swal from "sweetalert2";

// 1. IMPORT KATEX
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function UjianPage() {
  const [soal, setSoal] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jawaban, setJawaban] = useState({});

  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const sessionId = paramSessionId || localStorage.getItem("examSessionId");
  //pagination

  const [current, setCurrent] = useState(() => {
    const savedPage = localStorage.getItem(`lastPage-${sessionId}`);
    return savedPage ? parseInt(savedPage) : 0;
  });

  useEffect(() => {
    const currentSession = localStorage.getItem("examSessionId");

    // Jika di localStorage sudah dihapus (berarti sudah submit),
    // tapi user maksa masuk/back ke sini, langsung tendang balik!
    if (!currentSession) {
      navigate("/siswa", { replace: true });
    }
  }, [navigate]);

  // Simpan posisi nomor soal terakhir ke localStorage
  useEffect(() => {
    if (sessionId && current !== null) {
      localStorage.setItem(`lastPage-${sessionId}`, current);
    }
  }, [current, sessionId]);

  // 2. FUNGSI RENDER KATEX (Mendukung teks + rumus $)
  const renderMath = (teks) => {
    if (!teks) return "";
    const parts = teks.split(/(\$.*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        setLoading(true); // Pastikan loading dimulai

        // --- SIMULASI LOADING (Hapus bagian ini kalau sudah selesai testing) ---
        // await new Promise((resolve) => setTimeout(resolve, 500));
        // -----------------------------------------------------------------------

        const res = await api.get(`exam/session/${sessionId}/soal`);
        setSoal(res.data.soal);
        const sisaDetik = Math.floor((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000);
        setTimeLeft(sisaDetik);
      } catch (err) {
        console.error(err);
        // Pakai SweetAlert2 biar seragam dengan yang tadi
        Swal.fire({
          icon: "error",
          title: "Waduh, Error...",
          text: "Gagal memuat soal ujian. Coba refresh halamannya ya!",
          confirmButtonColor: "#10b981",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);
  //END LOAD SOAL + TIMER

  //SAVE PROGRESS
  // (load progress => hanya jalan sekali)
  useEffect(() => {
    if (!sessionId) return;

    const saved = localStorage.getItem(`jawaban-${sessionId}`);
    if (saved) {
      setJawaban(JSON.parse(saved));
    }
  }, [sessionId]);

  // save progress (Otomatis simpan tiap jawaban berubah)
  useEffect(() => {
    if (!sessionId || Object.keys(jawaban).length === 0) return;
    localStorage.setItem(`jawaban-${sessionId}`, JSON.stringify(jawaban));
  }, [jawaban, sessionId]);
  //END SAVE PROGRESS

  //handle jawab yang ada matrix soal nya
  const handleJawab = (soalId, value, multiple, isMatrix) => {
    setJawaban((prev) => {
      // 1. Logika untuk Matrix (Kategori)
      if (isMatrix) {
        return {
          ...prev,
          [soalId]: value, // value di sini sudah berupa object {A: "Benar", B: "Salah"}
        };
      }

      // 2. Logika untuk Multiple Choice (Lama)
      if (multiple) {
        const prevArr = prev[soalId] || [];
        return {
          ...prev,
          [soalId]: prevArr.includes(value) ? prevArr.filter((v) => v !== value) : [...prevArr, value],
        };
      }

      // 3. Logika untuk Pilihan Ganda Biasa (Lama)
      return { ...prev, [soalId]: value };
    });
  };
  //handle jawab yang ada matrix soal nya

  const submitExam = async () => {
    if (!sessionId) return;

    // 1. Tampilkan Konfirmasi Dulu
    const confirm = await Swal.fire({
      title: "Yakin udah selesai?",
      // text: "Coba cek lagi deh, mana tahu ada jawaban yang masih ragu-ragu. Kalau udah oke semua, baru deh klik kirim!",
      html: `
    <div class="text-center">
      <p class="text-sm opacity-80">Coba cek lagi deh, mana tahu ada soal yang kelewat. Kalau udah oke, langsung meluncur!</p>
      <div class="badge badge-primary mt-4 py-3">Total ${soal.length} Soal Terjawab</div>
    </div>
  `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Warna Emerald
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Kirim Sekarang!",
      cancelButtonText: "Eh bentar, cek lagi!",
      borderRadius: "15px",
    });

    if (confirm.isConfirmed) {
      try {
        // Tampilkan loading sebentar
        Swal.fire({
          title: "Mengirim...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await api.post("exam/submit", { sessionId, jawaban });

        // 2. Alert Berhasil
        await Swal.fire({
          title: "Berhasil!",
          text: "Jawaban kamu sudah tersimpan di server.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });

        // Hapus storage
        localStorage.removeItem(`jawaban-${sessionId}`);
        localStorage.removeItem("examSessionId");
        localStorage.removeItem(`lastPage-${sessionId}`);

        navigate(`/siswa`, { replace: true });
      } catch (err) {
        // 3. Alert Gagal
        Swal.fire({
          title: "Gagal!",
          text: err.response?.data?.message || "Gagal submit ujian",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleAutoSubmit = async () => {
    if (!sessionId) return;

    try {
      // Beri tahu siswa kalau waktu sudah habis
      Swal.fire({
        title: "Waktu Habis! ⏰",
        text: "Chill ya, jawabanmu lagi meluncur ke server...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      await api.post("exam/submit", { sessionId, jawaban });

      // Hapus storage
      localStorage.removeItem(`jawaban-${sessionId}`);
      localStorage.removeItem("examSessionId");

      await Swal.fire({
        title: "Finish! ",
        html: `
        <div className="space-y-2">
          <p className="text-lg">Waktunya udah abis, Bestie! 🧘‍♂️</p>
          <p className="text-sm opacity-70">Jawaban kamu udah aman kok di database. Sekarang waktunya tarik napas dulu~</p>
        </div>
      `,
        // text: "Waktu habis, tapi jangan khawatir, jawabanmu sudah aman tersimpan.",
        icon: "success",
        confirmButtonText: "Oke, Makasih!",
        confirmButtonColor: "#10b981",
      });

      navigate(`/siswa`);
    } catch {
      Swal.fire({
        title: "Gagal!",
        text: "Waktu habis dan gagal kirim otomatis. Segera hubungi pengawas!",
        icon: "error",
      });
    }
  };
  //END SUBMIT EXAM

  // VALIDASI TOMBOL SUBMIT bisa di klik kalau soal sudah terjawab semua
  const isAllAnswered =
    soal.length > 0 &&
    soal.every((q) => {
      const ans = jawaban[q._id];

      if (q.multiple) {
        return Array.isArray(ans) && ans.length > 0;
      }

      return ans !== undefined && ans !== null && ans !== "";
    });

  // END VALIDASI TOMBOL SUBMIT

  useEffect(() => {
    // Masukkan state palsu ke history browser
    window.history.pushState(null, null, window.location.pathname);

    const handlePopState = () => {
      // Jika tombol back ditekan, paksa tetap di halaman ini
      window.history.pushState(null, null, window.location.pathname);
      Swal.fire({
        title: "Gunakan Navigasi Ujian",
        text: "Jangan gunakan tombol Back browser agar progresmu aman.",
        icon: "warning",
        confirmButtonColor: "#10b981",
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  //TIMER (setelah ambil diatas di proses disini)
  //submit ketika waktu habis
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    // navigate(`/siswa`);

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);
  //END TIMER

  const q = soal[current];

  const LoadingScreen = () => {
    const quotes = [
      "Tenang, napas dulu... Soal lagi disiapin!",
      "Lagi jemput soal dari server, tunggu bentar yaa",
      "Doa dulu biar lancar ngerjainnya...",
      "Lagi loading... lebih cepet dari nunggu balasan dia kok!",
      "Fokus! Kamu pasti bisa ngerjain soal ini. Semangat!",
    ];

    // Ambil quote acak
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        {/* Animasi Ikon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 border-8 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="absolute inset-0 flex items-center justify-center text-3xl">📝</span>
        </div>

        {/* Teks Loading */}
        <h2 className="text-2xl font-black text-emerald-800 mb-2 animate-pulse">Tunggu Sebentar...</h2>

        {/* Quote Box */}
        <div className="card bg-white shadow-sm border border-emerald-100 p-4 max-w-xs">
          <p className="text-emerald-700 italic font-medium">"{randomQuote}"</p>
        </div>

        {/* Progress Bar Kecil */}
        <div className="w-full max-w-xs mt-6">
          <progress className="progress progress-primary w-full"></progress>
          <p className="text-[10px] mt-2 uppercase tracking-widest font-bold opacity-40">Syncing with server...</p>
        </div>
      </div>
    );
  };
  if (!sessionId) return <p>Session ID tidak ditemukan.</p>;
  if (loading) return <LoadingScreen />;

  //handler format
  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return "00:00";

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SISI KIRI: KONTEN SOAL (3 Kolom) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Mapel & Status */}
          <div className="flex justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm border border-base-300">
            <div>
              <h1 className="text-xl font-bold text-emerald-800">{q?.mapel === "bi" ? "Bahasa Indonesia" : "Matematika"}</h1>
              <p className="text-sm opacity-60">Yakin aja, kamu pasti bisa</p>
            </div>
            <div className={`text-right ${timeLeft <= 60 ? "text-error animate-pulse" : "text-base-content"}`}>
              <span className="text-xs uppercase font-bold block">Sisa Waktu</span>
              <span className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Card Soal */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              {/* Nomor Soal Badge */}
              <div className="flex justify-between items-start mb-6">
                <span className="badge badge-primary badge-lg p-4 font-bold text-white uppercase tracking-wider">Soal {current + 1}</span>
                {q.isMatrix ? (
                  <span className="badge badge-info font-bold italic text-white shadow-sm">Tipe Kategori</span>
                ) : (
                  q.multiple && <span className="badge badge-warning font-bold italic shadow-sm">Pilih lebih dari satu</span>
                )}
              </div>

              {/* LOGIKA WACANA & PERTANYAAN */}
              {(() => {
                // 1. Pecah dulu berdasarkan @@
                const parts = q.pertanyaan.split("@@");
                const hasWacana = parts.length > 1;
                const wacanaText = hasWacana ? parts[0] : null;
                const soalText = hasWacana ? parts[1] : parts[0];

                return (
                  <>
                    {/* Tampilan Tombol Wacana jika ada (Khusus HP & Desktop) */}
                    {hasWacana && (
                      <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📖</span>
                          <div>
                            <p className="font-bold text-emerald-900 text-sm">Teks Bacaan Tersedia</p>
                            <p className="text-xs text-emerald-700">Gunakan teks ini untuk menjawab soal</p>
                          </div>
                        </div>
                        {/* Button untuk buka Modal DaisyUI */}
                        <label htmlFor="modal-wacana" className="btn btn-emerald btn-sm btn-outline shadow-sm">
                          Baca Teks
                        </label>
                      </div>
                    )}

                    {/* Render Isi Pertanyaan (Tetap pakai logika split "|" kamu) */}
                    <div className="text-lg leading-relaxed mb-8">
                      {soalText.split("|").map((bagian, index) => {
                        const isi = bagian.trim();
                        if (isi.startsWith("http")) {
                          return (
                            <div key={index} className="my-6 flex justify-center">
                              <div className="bg-base-200 p-2 rounded-2xl border border-base-300 shadow-sm inline-block">
                                <img src={isi} alt="Gambar Soal" className="max-w-full h-auto rounded-xl object-contain max-h-[400px]" />
                                <div className="text-[10px] text-center mt-2 opacity-50 uppercase font-bold tracking-widest">Lampiran Gambar Soal</div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="mb-3 font-medium text-base-content/90">
                            {renderMath(isi)}
                          </div>
                        );
                      })}
                    </div>

                    {/* MODAL DAISY UI (Diletakkan di luar card-body agar rapi) */}
                    {hasWacana && (
                      <>
                        <input type="checkbox" id="modal-wacana" className="modal-toggle" />
                        <div className="modal modal-bottom sm:modal-middle ">
                          <div className="modal-box bg-base-100 max-w-2xl ">
                            <h3 className="font-bold text-lg flex items-center gap-2 ">
                              <span className="text-xl">📖</span> Teks Bacaan
                            </h3>
                            <div className="max-h-[60vh] overflow-y-auto border-b border-t pr-2 leadi ng-relaxed text-base-content/80 italic">
                              {/* Render wacana dengan support | untuk enter */}
                              {wacanaText.split("|").map((p, idx) => (
                                <p key={idx} className="mb-4">
                                  {renderMath(p.trim())}
                                </p>
                              ))}
                            </div>
                            <div className="modal-action">
                              <label htmlFor="modal-wacana" className="btn btn-primary w-full text-white">
                                Tutup & Jawab Soal
                              </label>
                            </div>
                          </div>
                          <label className="modal-backdrop" htmlFor="modal-wacana">
                            Close
                          </label>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Input Jawaban - Kondisional */}
              <div className="grid grid-cols-1 gap-3">
                {q.isMatrix ? (
                  /* --- TAMPILAN TABEL MATRIX --- */
                  <div className="overflow-x-auto border border-base-300 rounded-xl">
                    <table className="table w-full">
                      <thead className="bg-base-200">
                        <tr>
                          <th className="w-16 text-center border-r border-base-300">#</th>
                          <th className="border-r border-base-300">Pernyataan</th>
                          {q.columns.map((col, idx) => (
                            <th key={idx} className="text-center">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.sub_pertanyaan.map((sub) => (
                          <tr key={sub.id} className="hover:bg-base-50">
                            <td className="text-center font-bold border-r border-base-300">{sub.id}</td>
                            <td className="border-r border-base-300">{renderMath(sub.teks)}</td>
                            {q.columns.map((col, idx) => {
                              // Logika check: jawaban[q._id] untuk matrix berbentuk object {A: "Benar", B: "Salah"}
                              const isChecked = jawaban[q._id]?.[sub.id] === col;

                              return (
                                <td key={idx} className="text-center">
                                  <input
                                    type="radio"
                                    name={`${q._id}_${sub.id}`}
                                    className="radio radio-primary"
                                    checked={isChecked}
                                    onChange={() => {
                                      // Ambil state jawaban saat ini untuk soal ini saja
                                      const currentMatrixAnswers = jawaban[q._id] || {};

                                      // Gabungkan jawaban lama dengan baris yang baru diklik
                                      const updatedValue = {
                                        ...currentMatrixAnswers,
                                        [sub.id]: col,
                                      };

                                      // Panggil handleJawab dengan flag isMatrix = true
                                      handleJawab(q._id, updatedValue, false, true);
                                    }}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* --- TAMPILAN PG & MULTIPLE ASLI --- */
                  q.opsi.map((opsi, idx) => {
                    const isSelected = q.multiple ? (jawaban[q._id] || []).includes(opsi) : jawaban[q._id] === opsi;

                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all active:scale-[0.98]
              ${isSelected ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-base-300 hover:border-emerald-300 hover:bg-base-200"}`}
                      >
                        <input
                          type={q.multiple ? "checkbox" : "radio"}
                          name={q._id}
                          className={`${q.multiple ? "checkbox" : "radio"} radio-primary`}
                          checked={isSelected}
                          onChange={() => handleJawab(q._id, opsi, q.multiple)}
                        />
                        <span className={`font-medium ${isSelected ? "text-emerald-800" : "text-base-content"}`}>{renderMath(opsi)}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          {/* end card soal */}

          {/* Navigasi Prev/Next */}
          <div className="flex justify-between gap-4">
            <button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)} className="btn btn-outline btn-primary px-8">
              ← Prev
            </button>

            {/* Progress Bar Center */}
            <div className="grow max-w-md w-full px-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mx-auto">PROGRES PENGERJAAN SOAL</span>
              </div>
              <div className="relative w-full h-3 bg-emerald-100 rounded-full overflow-hidden shadow-inner border border-emerald-200">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${((current + 1) / soal.length) * 100}%` }}
                >
                  {/* Efek kilau pada progress */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20 animate-[shimmer_2s_linear_infinite]"></div>
                </div>
              </div>
            </div>

            <button disabled={current === soal.length - 1} onClick={() => setCurrent((c) => c + 1)} className="btn btn-primary px-10 text-white shadow-md">
              Next →
            </button>
          </div>
        </div>

        {/* SISI KANAN: NAVIGATION BOARD (1 Kolom) */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300 h-fit">
            <div className="card-body p-5">
              <h3 className="font-bold text-center border-b pb-3 mb-4">Navigasi Soal</h3>

              {/* Grid Bulet-bulet */}
              <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
                {soal.map((_, i) => {
                  const isAktif = i === current;
                  const isSudahJawab = jawaban[soal[i]._id];

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-10 h-10 rounded-full text-xs font-bold border transition-all
                      ${
                        isAktif
                          ? "bg-primary text-white border-primary ring-2 ring-primary ring-offset-2"
                          : isSudahJawab
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-base-100 text-base-content border-base-300 hover:border-primary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Keterangan */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase font-black opacity-50">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>Terjawab</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-black opacity-50">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Posisi Anda</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="space-y-3">
            <button onClick={submitExam} disabled={!isAllAnswered} className={`btn w-full text-white shadow-lg ${isAllAnswered ? "btn-success" : "btn-disabled"}`}>
              Selesaikan Ujian
            </button>
            {/* {!isAllAnswered && (
              <p className="alert alert-error text-[11px] p-2 py-3 shadow-sm flex gap-1 justify-center">
                <span>⚠️ Selesaikan semua soal</span>
              </p>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
