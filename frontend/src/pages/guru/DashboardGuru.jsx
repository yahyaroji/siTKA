import { useState } from "react";
import TabelSiswa from "./TabelSiswa";
import TabelSoal from "./TabelSoal";
import PreviewSoal from "./PreviewSoal";

export default function DashboardGuru() {
  const [activeTab, setActiveTab] = useState("siswa");

  return (
    <div className="min-h-screen bg-base-200">
      {/* HEADER GURU */}
      <div className="bg-emerald-800 text-white pt-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard Guru</h1>
            <p className="opacity-70 mt-1">Kelola data siswa dan bank soal dalam satu tempat.</p>
          </div>
          {/* <div className="hidden md:block text-right">
            <p className="text-sm font-bold opacity-50 uppercase">Tahun Ajaran</p>
            <p className="text-xl font-bold">2024/2025</p>
          </div> */}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto -mt-10 px-6 pb-12">
        {/* NAVIGASI TAB */}
        <div className="tabs tabs-boxed bg-white p-2 shadow-lg mb-6 inline-flex border border-base-300">
          <button onClick={() => setActiveTab("siswa")} className={`tab tab-lg font-bold transition-all gap-2 ${activeTab === "siswa" ? "tab-active !bg-emerald-500 !text-white" : ""}`}>
            👥 Data Siswa
          </button>
          <button onClick={() => setActiveTab("soal")} className={`tab tab-lg font-bold transition-all gap-2 ${activeTab === "soal" ? "tab-active !bg-emerald-500 !text-white" : ""}`}>
            📚 Bank Soal
          </button>
          {/* Tab Baru */}
          <button onClick={() => setActiveTab("preview")} className={`tab tab-lg font-bold transition-all gap-2 ${activeTab === "preview" ? "tab-active !bg-emerald-500 !text-white" : ""}`}>
            🔍 Preview Soal
          </button>
        </div>

        {/* RENDER KONTEN BERDASARKAN TAB */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Logika Tab Data Siswa */}
          {activeTab === "siswa" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2 ml-1">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-emerald-900">Manajemen Siswa</h2>
              </div>
              <div className="card bg-white shadow-xl border border-base-300">
                <div className="card-body p-0 md:p-6">
                  <TabelSiswa />
                </div>
              </div>
            </section>
          )}

          {/* Logika Tab Pengaturan Soal */}
          {activeTab === "soal" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2 ml-1">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-emerald-900">Pengaturan Soal</h2>
              </div>
              <div className="card bg-white shadow-xl border border-base-300">
                <div className="card-body p-0 md:p-6">
                  <TabelSoal />
                </div>
              </div>
            </section>
          )}

          {/* Logika Tab Preview Soal (Halaman Baru Kamu) */}
          {activeTab === "preview" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2 ml-1">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-emerald-900">Preview Tampilan Ujian</h2>
              </div>
              <div className="card bg-white shadow-xl border border-base-300">
                <div className="card-body p-4 md:p-6">
                  {/* Masukkan komponen BankSoalPage kamu di sini */}
                  <PreviewSoal />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
