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
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* HEADER FILTER PREVIEW - Neo-Brutal Style */}
      <div className="bg-[#2196f3] p-6 rounded-[2.5rem] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <span className="bg-white p-2 rounded-xl text-[#2196f3] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">🖥️</span>
            LIVE PREVIEW
          </h2>
          <p className="text-[10px] text-blue-100 font-black uppercase tracking-[0.2em] mt-1">Simulasi Tampilan Layar Ujian Siswa</p>
        </div>

        <div className="flex gap-4">
          <select
            className="bg-white border-[3px] border-black rounded-2xl px-4 py-2 font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0"
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
          >
            <option value="bi">INDONESIAN</option>
            <option value="mtk">MATHEMATICS</option>
          </select>

          <select
            className="bg-white border-[3px] border-black rounded-2xl px-4 py-2 font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0"
            value={stage}
            onChange={(e) => setStage(Number(e.target.value))}
          >
            <option value={1}>STAGE 1</option>
            <option value={2}>STAGE 2</option>
            <option value={3}>STAGE 3</option>
          </select>
        </div>
      </div>

      {/* RENDER KONTEN PREVIEW */}
      {loading ? (
        <div className="p-32 text-center bg-white rounded-[3rem] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <div className="loading loading-spinner loading-lg text-[#2196f3]"></div>
          <p className="mt-6 font-black text-black uppercase tracking-widest text-sm">Menyiapkan Lembar Soal...</p>
        </div>
      ) : soal.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* AREA SOAL (Sisi Kiri) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[3rem] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-8 md:p-12">
                {/* Header Info Nomor & Jenis Soal */}
                <div className="flex flex-wrap justify-between items-center mb-10 pb-6 border-b-[3px] border-gray-100 gap-4">
                  <div className="flex items-center gap-4">
                    <span className="bg-black text-[#FFD600] px-6 py-2 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">SOAL NO. {current + 1}</span>

                    {soal[current].isMatrix ? (
                      <span className="bg-emerald-100 text-emerald-700 border-2 border-emerald-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">KATEGORI MATRIX</span>
                    ) : (
                      <span className="bg-blue-100 text-[#2196f3] border-2 border-blue-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {soal[current].multiple ? "MULTIPLE CHOICE" : "SINGLE CHOICE"}
                      </span>
                    )}
                  </div>
                </div>

                {/* LOGIKA PERTANYAAN */}
                {(() => {
                  const q = soal[current];
                  const parts = q.pertanyaan.split("@@");
                  const hasWacana = parts.length > 1;
                  const wacanaText = hasWacana ? parts[0] : null;
                  const soalText = hasWacana ? parts[1] : parts[0];

                  return (
                    <div className="space-y-8">
                      {hasWacana && (
                        <div className="p-6 bg-gray-50 border-[3px] border-black rounded-[2rem] text-gray-700 text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)] leading-relaxed">
                          <p className="font-black mb-3 text-black uppercase tracking-widest text-[10px]">📌 Bacaan Soal:</p>
                          {wacanaText.split("|").map((p, i) => (
                            <p key={i} className="mb-2">
                              {renderMath(p)}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="text-xl md:text-2xl text-black leading-snug font-bold">
                        {soalText.split("|").map((bagian, idx) =>
                          bagian.trim().startsWith("http") ? (
                            <img key={idx} src={bagian} className="max-w-full h-auto rounded-[2rem] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] my-8 mx-auto" alt="lampiran" />
                          ) : (
                            <div key={idx} className="mb-4">
                              {renderMath(bagian)}
                            </div>
                          )
                        )}
                      </div>

                      {/* AREA OPSI JAWABAN */}
                      <div className="mt-12">
                        {q.isMatrix ? (
                          <div className="overflow-hidden border-[3px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                            <table className="table w-full">
                              <thead className="bg-gray-100 border-b-[3px] border-black">
                                <tr>
                                  <th className="bg-gray-100 text-black font-black uppercase text-[10px] tracking-widest p-4">Pernyataan</th>
                                  {q.columns?.map((c, i) => (
                                    <th key={i} className="bg-gray-100 text-center text-black font-black uppercase text-[10px] p-4 border-l-2 border-black/10">
                                      {c}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y-2 divide-gray-100">
                                {q.sub_pertanyaan?.map((sub, sIdx) => (
                                  <tr key={sIdx} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="text-black font-bold p-5">{renderMath(sub.teks)}</td>
                                    {q.columns?.map((_, i) => (
                                      <td key={i} className="text-center border-l-2 border-gray-50">
                                        <input type="radio" className="radio border-2 border-black radio-primary w-6 h-6" disabled />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {q.opsi?.map((o, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-5 p-5 border-[3px] border-black rounded-3xl bg-white hover:bg-blue-50 hover:translate-x-2 transition-all cursor-pointer group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              >
                                <div className="w-10 h-10 rounded-xl bg-black text-[#FFD600] flex items-center justify-center font-black transition-colors">{String.fromCharCode(65 + idx)}</div>
                                <span className="font-bold text-lg text-black">{renderMath(o)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* NAVIGASI TOMBOL - Neo-Brutal Style */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4">
              <button
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
                className="w-full md:w-auto px-10 py-4 bg-white border-[3px] border-black rounded-2xl font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← SEBELUMNYA
              </button>

              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Progress Pengerjaan</span>
                <div className="w-64 h-4 bg-gray-100 border-[3px] border-black rounded-full overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <div className="h-full bg-[#2196f3] transition-all duration-500" style={{ width: `${((current + 1) / soal.length) * 100}%` }}></div>
                </div>
              </div>

              <button
                disabled={current === soal.length - 1}
                onClick={() => setCurrent((c) => c + 1)}
                className="w-full md:w-auto px-10 py-4 bg-[#2196f3] text-white border-[3px] border-black rounded-2xl font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 transition-all"
              >
                SELANJUTNYA →
              </button>
            </div>
          </div>

          {/* NAVIGASI NOMOR (Sisi Kanan) */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="font-black text-center text-[10px] uppercase tracking-[0.2em] mb-6 text-gray-400">Peta Soal</h3>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {soal.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-12 rounded-xl text-xs font-black transition-all border-[3px]
                    ${i === current ? "bg-black text-[#FFD600] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" : "bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* KETERANGAN KUNCI - Khusus Guru */}
            <div className="bg-[#FFD600] rounded-[2.5rem] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🔑</span>
                <h4 className="font-black text-[10px] uppercase tracking-widest text-black">Kunci Jawaban Guru</h4>
              </div>
              <div className="bg-white/50 border-2 border-black/10 rounded-2xl p-4">
                {/* <p className="text-sm font-black text-black break-words">
                  {Array.isArray(soal[current].jawaban) ? soal[current].jawaban.join(", ") : typeof soal[current].jawaban === "object" ? JSON.stringify(soal[current].jawaban) : soal[current].jawaban}
                </p> */}
                <div className="text-sm font-black text-black break-words flex flex-col items-center justify-center gap-2">
                  {(() => {
                    const jwb = soal[current]?.jawaban;
                    const listOpsi = soal[current]?.opsi || [];

                    const renderLatex = (val) => {
                      if (typeof val === "string" && val.startsWith("$") && val.endsWith("$")) {
                        const mathContent = val.slice(1, -1);
                        return <InlineMath math={mathContent} />;
                      }
                      return val;
                    };

                    // FUNGSI PENCARI HURUF YANG LEBIH CERDAS
                    const cariHurufDariOpsi = (teksJawaban) => {
                      if (!teksJawaban) return "?";

                      const index = listOpsi.findIndex((item) => {
                        // Normalisasi teks: hapus spasi dan jadikan huruf kecil semua
                        const cleanOpsi = String(item).trim().toLowerCase();
                        const cleanJwb = String(teksJawaban).trim().toLowerCase();
                        return cleanOpsi === cleanJwb;
                      });

                      if (index !== -1) {
                        return String.fromCharCode(65 + index); // 0->A, 1->B, dst
                      }
                      return "?";
                    };

                    if (!jwb) return <span className="opacity-30 italic">Belum diisi</span>;

                    // 1. JIKA FORMAT MATRIX (OBJECT)
                    if (typeof jwb === "object" && !Array.isArray(jwb)) {
                      try {
                        const rows = Object.values(jwb);
                        const matrixContent = rows.map((row) => (Array.isArray(row) ? row.join(" & ") : row)).join(" \\\\ ");
                        return (
                          <div className="bg-white/30 px-4 py-2 rounded-xl border border-black/5">
                            <InlineMath math={`\\begin{pmatrix} ${matrixContent} \\end{pmatrix}`} />
                          </div>
                        );
                      } catch {
                        return <span className="text-[10px] opacity-50">{JSON.stringify(jwb)}</span>;
                      }
                    }

                    // 2. JIKA JAWABAN MULTIPLE (ARRAY)
                    if (Array.isArray(jwb)) {
                      return (
                        <div className="flex flex-col gap-2 w-full items-start px-4">
                          {jwb.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 w-full border-b border-black/5 pb-2 last:border-0 last:pb-0">
                              <span className="bg-black text-white w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                {cariHurufDariOpsi(item)}
                              </span>
                              <div className="flex-1 text-left self-center font-bold">{renderLatex(item)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // 3. JIKA JAWABAN TUNGGAL
                    return (
                      <div className="flex flex-col gap-2 w-full items-start px-4">
                        <div className="flex items-start gap-3 w-full">
                          <span className="bg-black text-white w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                            {cariHurufDariOpsi(jwb)}
                          </span>
                          <div className="flex-1 text-left self-center font-bold">{renderLatex(jwb)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <p className="text-[9px] font-bold text-black/40 mt-3 italic text-center">Rahasia: Siswa tidak akan melihat panel ini.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-32 text-center bg-white rounded-[3rem] border-[3px] border-black border-dashed">
          <div className="text-6xl mb-6 grayscale">📭</div>
          <p className="text-gray-400 font-black uppercase tracking-[0.3em]">Lembar Soal Kosong</p>
        </div>
      )}
    </div>
  );
}
