// src/pages/guru/BankSoalPage.jsx
import { useEffect, useState } from "react";
import { getSoalList } from "../../api/guruService"; // Sesuaikan path ini
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function BankSoalPage() {
  const [soal, setSoal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);

  // State untuk filter agar guru bisa pilih soal mana yang mau di-preview
  const [mapel, setMapel] = useState("bi");
  const [stage, setStage] = useState(1);

  // 1. Ambil data soal berdasarkan filter
  const loadDataSoal = async () => {
    try {
      setLoading(true);
      // Kita ambil limit banyak (misal 50) supaya bisa di-preview semua
      const res = await getSoalList({ mapel, stage, page: 1, limit: 50 });
      setSoal(res.data.data || []);
      setCurrent(0);
    } catch (err) {
      console.error("Gagal load soal untuk preview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataSoal();
  }, [mapel, stage]);

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

  return (
    <div className="space-y-6">
      {/* HEADER FILTER PREVIEW */}
      <div className="card bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
        <div className="card-body p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold italic flex items-center gap-2">🖥️ LIVE PREVIEW</h2>
            <p className="text-xs opacity-70 font-medium">Tampilan yang akan dilihat siswa di layar ujian</p>
          </div>

          <div className="flex gap-2">
            <select className="select select-sm select-bordered text-slate-900 font-bold" value={mapel} onChange={(e) => setMapel(e.target.value)}>
              <option value="bi">Bahasa Indonesia</option>
              <option value="mtk">Matematika</option>
            </select>

            <select className="select select-sm select-bordered text-slate-900 font-bold" value={stage} onChange={(e) => setStage(Number(e.target.value))}>
              <option value={1}>Stage 1</option>
              <option value={2}>Stage 2</option>
              <option value={3}>Stage 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* RENDER KONTEN PREVIEW */}
      {loading ? (
        <div className="p-20 text-center bg-white rounded-3xl border shadow-inner">
          <div className="loading loading-spinner loading-lg text-indigo-600"></div>
          <p className="mt-4 font-bold text-slate-400">Menyiapkan tampilan soal...</p>
        </div>
      ) : soal.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {/* AREA SOAL (Gaya Siswa) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card bg-white shadow-xl border-t-8 border-indigo-500 overflow-hidden">
              <div className="card-body p-6 md:p-10">
                {/* Header Info Nomor & Jenis Soal */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-lg bg-slate-800 text-white p-4 font-black">SOAL NO. {current + 1}</span>

                    {/* LABEL JENIS SOAL */}
                    {soal[current].isMatrix ? (
                      <span className="badge badge-secondary font-bold px-4 py-3">KATEGORI / MATRIX</span>
                    ) : soal[current].multiple ? (
                      <span className="badge badge-warning font-bold px-4 py-3 text-white">PILIHAN GANDA KOMPLEKS (MULTIPLE)</span>
                    ) : (
                      <span className="badge badge-info font-bold px-4 py-3 text-white">PILIHAN GANDA (SINGLE)</span>
                    )}
                  </div>

                  {/* <div className="text-right hidden md:block">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Tampilan</div>
                    <div className="font-black text-emerald-600 uppercase">Live Preview</div>
                  </div> */}
                </div>

                {/* LOGIKA PERTANYAAN */}
                {(() => {
                  const q = soal[current];
                  const parts = q.pertanyaan.split("@@");
                  const hasWacana = parts.length > 1;
                  const wacanaText = hasWacana ? parts[0] : null;
                  const soalText = hasWacana ? parts[1] : parts[0];

                  return (
                    <div className="space-y-6">
                      {hasWacana && (
                        <div className="p-5 bg-slate-50 border-l-4 border-indigo-500 rounded-r-2xl italic text-slate-700 text-sm shadow-inner">
                          <p className="font-bold mb-2 not-italic text-indigo-700">📌 Bacaan Soal:</p>
                          {wacanaText.split("|").map((p, i) => (
                            <p key={i} className="mb-2 leading-relaxed">
                              {renderMath(p)}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="text-xl text-slate-800 leading-relaxed font-medium">
                        {soalText.split("|").map((bagian, idx) =>
                          bagian.trim().startsWith("http") ? (
                            <img key={idx} src={bagian} className="max-w-full h-auto rounded-xl shadow-lg my-6 border-4 border-white mx-auto" alt="lampiran" />
                          ) : (
                            <div key={idx} className="mb-4">
                              {renderMath(bagian)}
                            </div>
                          )
                        )}
                      </div>

                      {/* AREA OPSI JAWABAN */}
                      <div className="grid grid-cols-1 gap-3 mt-10">
                        {q.isMatrix ? (
                          <div className="overflow-x-auto border-2 rounded-2xl border-slate-100">
                            <table className="table w-full bg-white">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="w-12 text-center text-slate-400 italic">No</th>
                                  <th className="text-slate-600">Pernyataan</th>
                                  {q.columns?.map((c, i) => (
                                    <th key={i} className="text-center text-indigo-600 font-bold uppercase text-[10px]">
                                      {c}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {q.sub_pertanyaan?.map((sub, sIdx) => (
                                  <tr key={sIdx} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="font-bold text-center text-slate-300">{sub.id}</td>
                                    <td className="text-slate-700 font-medium">{renderMath(sub.teks)}</td>
                                    {q.columns?.map((_, i) => (
                                      <td key={i} className="text-center">
                                        <input type="radio" className="radio radio-primary radio-sm opacity-30" disabled />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          q.opsi?.map((o, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl bg-white hover:border-indigo-200 transition-all group">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="font-semibold text-slate-600">{renderMath(o)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* NAVIGASI TOMBOL */}
            <div className="flex justify-between items-center p-2">
              <button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)} className="btn btn-outline border-slate-200 gap-2">
                ← PREV
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-center">Simulasi Navigasi Siswa</span>
                <progress className="progress progress-primary w-56" value={current + 1} max={soal.length}></progress>
              </div>
              <button disabled={current === soal.length - 1} onClick={() => setCurrent((c) => c + 1)} className="btn btn-primary px-8 shadow-lg shadow-indigo-200 gap-2">
                NEXT →
              </button>
            </div>
          </div>

          {/* NAVIGASI NOMOR (SISI KANAN) */}
          <div className="space-y-4">
            <div className="card bg-white shadow-xl border border-slate-100">
              <div className="card-body p-4">
                <h3 className="font-black text-center text-[10px] uppercase tracking-widest mb-4 text-slate-400">Daftar Soal</h3>
                <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-96 p-1">
                  {soal.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`h-10 rounded-xl text-xs font-black transition-all border-2
                        ${i === current ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-indigo-300"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* KETERANGAN KUNCI (KHUSUS GURU) */}
            <div className="card bg-amber-50 border border-amber-200 shadow-sm">
              <div className="card-body p-4 text-amber-900">
                <h4 className="font-black text-xs mb-2">🔑 Kunci Jawaban:</h4>
                <p className="text-sm font-bold bg-white p-2 rounded border border-amber-200">
                  {Array.isArray(soal[current].jawaban) ? soal[current].jawaban.join(", ") : typeof soal[current].jawaban === "object" ? JSON.stringify(soal[current].jawaban) : soal[current].jawaban}
                </p>
                <p className="text-[10px] opacity-60 mt-2 italic">*Hanya Anda yang bisa melihat ini (Siswa tidak)</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner animate-pulse">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400 font-black uppercase tracking-widest">Tidak ada soal ditemukan</p>
          <p className="text-xs text-slate-300">Coba ubah filter Mapel atau Stage di atas</p>
        </div>
      )}
    </div>
  );
}
