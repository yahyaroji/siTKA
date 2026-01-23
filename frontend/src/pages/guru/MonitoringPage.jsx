import { useEffect, useState, useCallback } from "react";
import api from "../../api/examApi";
import { Trophy, RefreshCw, Maximize } from "lucide-react";

export default function MonitoringPage() {
  const [listSiswa, setListSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stage, setStage] = useState(1);

  const fetchMonitoring = useCallback(
    async (isAuto = false) => {
      if (!isAuto) setLoading(true);
      setIsRefreshing(true);
      try {
        const res = await api.get(`/exam/monitoring/live?stage=${stage}`);
        setListSiswa(res.data);
      } catch (err) {
        console.error("Gagal mengambil data monitoring:", err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [stage],
  );

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(() => {
      fetchMonitoring(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMonitoring]);

  const toggleFullScreen = () => {
    const elem = document.getElementById("dashboard-root");
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((e) => console.error(e));
    } else {
      document.exitFullscreen();
    }
  };

  const totalSelesai = listSiswa.filter((s) => s.status === "finished").length;
  const totalProses = listSiswa.filter((s) => s.status === "ongoing").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-200" data-theme="emerald">
        <span className="loading loading-spinner loading-lg text-emerald-600"></span>
        <p className="font-bold text-emerald-900/70 uppercase tracking-widest text-xs">Memuat Data siTKA...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-root" className="h-screen bg-base-200 flex flex-col p-4 overflow-hidden" data-theme="emerald">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #dashboard-root:fullscreen { padding: 1.5rem; background-color: #f2f7f5; }
            @keyframes scrollTeleport {
              0%, 2% { transform: translateY(0); opacity: 1; }
              94% { transform: translateY(min(0px, calc(-100% + (100vh - 250px)))); opacity: 1; }
              96% { transform: translateY(min(0px, calc(-100% + (100vh - 250px)))); opacity: 0; }
              97% { transform: translateY(0); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .animate-teleport { animation: scrollTeleport 100s linear infinite; }
          `,
        }}
      />

      {/* HEADER */}
      <div className="relative z-30 flex items-center justify-between bg-base-100 p-4 rounded-2xl shadow-sm border border-base-300 mb-4 h-24">
        {/* KIRI */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="text-4xl font-black text-emerald-900 tracking-tighter leading-none">
              si<span className="text-emerald-600">TKA</span>
            </h1>
          </div>
          <p className="text-[11px] font-bold text-emerald-900/60 tracking-[0.15em] uppercase mt-1.5 ml-1">Update Skor, Gak Pake Telat</p>
        </div>

        {/* KANAN */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-200">
            <div className="text-right">
              <p className="text-[9px] font-black text-emerald-900 tracking-widest leading-none mb-1 opacity-70">SELESAI</p>
              <p className="text-2xl font-black text-emerald-600 leading-none tabular-nums">{totalSelesai}</p>
            </div>
            <div className="w-[1px] h-8 bg-emerald-200"></div>
            <div className="text-right">
              <p className="text-[9px] font-black text-blue-900 tracking-widest leading-none mb-1 opacity-70">PROSES</p>
              <p className="text-2xl font-black text-blue-600 leading-none tabular-nums">{totalProses}</p>
            </div>
            <div className="w-[1px] h-8 bg-emerald-200"></div>

            {/* TAHAP SELECTOR - Perbaikan Area Klik */}
            <div className="flex flex-col items-center">
              <p className="text-[9px] font-black text-emerald-900 tracking-widest leading-none mb-2 opacity-70">TAHAP</p>
              <div className="relative flex items-center bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer">
                <select
                  className="appearance-none bg-transparent font-black text-emerald-800 focus:outline-none text-[16px] cursor-pointer leading-none text-center pl-4 pr-9 py-1.5 z-10"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value={1}>01</option>
                  <option value={2}>02</option>
                  <option value={3}>03</option>
                </select>
                <div className="absolute right-3 flex flex-col gap-0.5 opacity-60 pointer-events-none">
                  <div className="w-1.5 h-0.5 bg-emerald-900 rounded-full"></div>
                  <div className="w-1.5 h-0.5 bg-emerald-900 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-base-300 pl-4">
            <button onClick={toggleFullScreen} className="btn btn-md btn-circle btn-ghost text-emerald-900 hover:bg-emerald-100">
              <Maximize size={20} />
            </button>
            <button onClick={() => fetchMonitoring()} className={`btn btn-md btn-circle btn-ghost bg-emerald-900 text-white hover:bg-emerald-700 ${isRefreshing ? "animate-spin" : ""}`}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 bg-base-100 rounded-2xl shadow-lg border border-base-300 overflow-hidden flex flex-col relative">
        <div className="z-20 bg-base-100 border-b-2 border-base-200">
          <table className="table table-xs w-full table-fixed">
            <thead>
              <tr className="text-center text-[10px] font-black uppercase text-base-content/60 bg-base-100">
                <th className="w-[30%] text-left py-4 pl-8">Siswa</th>
                <th className="w-[10%] text-center">Status</th>
                <th className="w-[15%] text-center">Progress</th>
                <th className="w-[10%] text-error italic font-black">BI</th>
                <th className="w-[10%] text-info italic font-black">MTK</th>
                <th className="w-[15%] text-center">Total Nilai</th>
                <th className="w-[10%] pr-8 text-right font-black">Time</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="flex-1 overflow-hidden relative z-10">
          <div className="absolute w-full px-4 animate-teleport">
            <table className="table table-xs w-full border-separate border-spacing-y-2 table-fixed">
              <tbody>
                {listSiswa.map((siswa, index) => {
                  const isFinished = siswa.status === "finished";
                  return (
                    <tr key={index} className={`border-none transition-all ${isFinished ? "bg-emerald-50/50" : "bg-warning/20 animate-pulse text-warning-content"}`}>
                      <td className="w-[30%] pl-8 py-2.5 rounded-l-xl border-y border-l border-base-300">
                        <div className="flex items-center gap-3">
                          <div className="min-w-[45px]">
                            {index === 0 ? (
                              <span className="animate-bounce inline-block">
                                👑 <span className="text-xs font-black text-yellow-600">1</span>
                              </span>
                            ) : (
                              <span className="text-[10px] opacity-30 font-bold">#{index + 1}</span>
                            )}
                          </div>
                          <span className={`font-extrabold text-xs uppercase truncate ${isFinished ? "text-emerald-700" : "text-base-content/80"}`}>{siswa.nama}</span>
                        </div>
                      </td>
                      <td className="w-[10%] border-y border-base-300 text-center">
                        <span className={`badge font-black text-[8px] h-4 ${isFinished ? "badge-success badge-outline" : "badge-warning border-none shadow-sm"}`}>
                          {isFinished ? "SELESAI" : "PROSES"}
                        </span>
                      </td>
                      <td className="w-[15%] border-y border-base-300 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <progress className={`progress w-20 h-1.5 ${isFinished ? "progress-success" : "progress-warning"}`} value={siswa.terjawab} max={siswa.totalSoal}></progress>
                          <span className="text-[10px] font-bold opacity-75">
                            {siswa.terjawab}/{siswa.totalSoal}
                          </span>
                        </div>
                      </td>
                      <td className="w-[10%] border-y border-base-300 text-center font-black text-error italic text-xs tabular-nums">{siswa.nilaiBI?.toFixed(1) || 0}</td>
                      <td className="w-[10%] border-y border-base-300 text-center font-black text-info italic text-xs tabular-nums">{siswa.nilaiMTK?.toFixed(1) || 0}</td>
                      <td className="w-[15%] border-y border-base-300 text-center">
                        <div
                          className={`inline-block px-2 py-0.5 rounded-md font-black text-xs min-w-[50px] ${isFinished ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-neutral text-neutral-content"}`}
                        >
                          {siswa.totalSkor?.toFixed(1) || 0}
                        </div>
                      </td>
                      <td className="w-[10%] pr-8 rounded-r-xl border-y border-r border-base-300 text-right text-[9px] font-black opacity-50 tabular-nums">
                        {new Date(siswa.lastActive).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
