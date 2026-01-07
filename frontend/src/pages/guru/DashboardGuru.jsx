import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelSiswa from "./TabelSiswa";
import TabelSoal from "./TabelSoal";
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
    // Gunakan tema "light" dan font sans yang tegas
    <div data-theme="light" className="min-h-screen bg-white text-black font-sans selection:bg-yellow-300">
      {/* HEADER: Bold & Minimalist (Gaya Dunderville) */}
      <div className="bg-white border-b-8 border-black pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase">
              Guru
              <br />
              Space.
            </h1>
            <p className="text-xl font-bold mt-4 tracking-tight opacity-40 uppercase">Management Dashboard / 2024</p>
          </div>
          <button onClick={handleLogout} className="border-4 border-black px-6 py-2 font-black hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* NAVIGASI TAB: Gaya Brutalist */}
        <div className="flex flex-wrap gap-2 mb-12">
          {[
            { id: "siswa", label: "Data Siswa", icon: "👥" },
            { id: "soal", label: "Bank Soal", icon: "📚" },
            { id: "preview", label: "Preview", icon: "🔍" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 font-black uppercase tracking-widest transition-all border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${
                activeTab === tab.id ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA: Tanpa Card Shadow Emerald lagi */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Wrapper */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-4 bg-black"></div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">
                {activeTab === "siswa" && "Manajemen Siswa"}
                {activeTab === "soal" && "Pengaturan Soal"}
                {activeTab === "preview" && "Preview Tampilan"}
              </h2>
            </div>

            {/* Container Konten: Garis tebal dan bersih */}
            <div className="border-4 border-black p-1 md:p-8 bg-white min-h-[400px]">
              {activeTab === "siswa" && <TabelSiswa />}
              {activeTab === "soal" && <TabelSoal />}
              {activeTab === "preview" && <PreviewSoal />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
