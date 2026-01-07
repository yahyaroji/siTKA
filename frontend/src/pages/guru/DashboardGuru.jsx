import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelSiswa from "./TabelSiswa";
import TabelSoal from "./TabelSoal";
import TabelSoal_copy from "./TabelSoal_copy";
import PreviewSoal from "./PreviewSoal";

export default function DashboardGuru() {
  const [activeTab, setActiveTab] = useState("siswa");
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Yakin mau keluar?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <>
      {/* Import font lokal */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        
        /* Custom Shadow agar konsisten */
        .shadow-saweria {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
        }
      `}</style>

      <div data-theme="gurudash" className="min-h-screen bg-[#F4F4F4] text-black font-['Plus_Jakarta_Sans'] selection:bg-[#FFD600]/30">
        {/* HEADER: Kuning Ikonik */}
        <div className="bg-[#FFD600] pt-20 pb-16 px-6 border-b-4 border-black shadow-lg">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-black text-[#FFD600] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">ADMIN Area</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-[800] tracking-tighter leading-none text-black">
                Teacher's<span className="opacity-20 text-black">Space.</span>
              </h1>
              <p className="text-lg font-bold mt-3 tracking-tight text-black/60">Manage your students & assignments</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-black text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 hover:scale-105 transition-all shadow-2xl active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="max-w-6xl mx-auto px-6 -mt-8">
          {/* NAVIGASI TAB: Pill Style dengan Shadow 3D */}
          <div className="flex flex-wrap gap-4 mb-10 bg-white p-3 rounded-[2rem] shadow-xl border border-gray-100 inline-flex">
            {[
              { id: "siswa", label: "Students", icon: "👥" },
              { id: "soal", label: "Questions", icon: "📚" },
              { id: "preview", label: "Preview", icon: "🔍" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-4 rounded-[1.2rem] font-extrabold text-sm uppercase tracking-tight transition-all ${
                  activeTab === tab.id ? "bg-[#FFD600] text-black shadow-[0_6px_0_0_#000] -translate-y-1" : "bg-transparent text-gray-400 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENT SECTION */}
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <section>
              <div className="flex items-center gap-4 mb-8 ml-2">
                <div className="h-10 w-3 bg-[#FFD600] rounded-full shadow-[2px_2px_0_0_#000]"></div>
                <h2 className="text-3xl font-[800] text-black tracking-tighter uppercase">
                  {activeTab === "siswa" && "Students"}
                  {activeTab === "soal" && "Questions"}
                  {activeTab === "preview" && "Preview"}
                </h2>
              </div>

              {/* Kontainer Utama Tabel */}
              <div className="bg-white rounded-[2.5rem] shadow-saweria p-8 md:p-10 border border-white min-h-[500px]">
                <div className="w-full">
                  {activeTab === "siswa" && <TabelSiswa />}
                  {activeTab === "soal" && <TabelSoal_copy />}
                  {activeTab === "preview" && <PreviewSoal />}
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <footer className="py-16 text-center">
            <div className="h-[1px] w-20 bg-black/10 mx-auto mb-6"></div>
            <p className="text-[10px] font-black tracking-[0.3em] opacity-30 uppercase">Academic Dashboard © 2024 • Built for Teachers</p>
          </footer>
        </div>
      </div>
    </>
  );
}
