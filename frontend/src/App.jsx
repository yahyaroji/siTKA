import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthProvider from "./context/AuthProvider";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import DashboardSiswa from "./pages/siswa/DashboardSiswa";
import UjianPage from "./pages/siswa/UjianPage";
// import HasilPage from "./pages/siswa/HasilPage";

import DashboardGuru from "./pages/guru/DashboardGuru";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ===== Default Route → Redirect ke /login ===== */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/siswa"
            element={
              <ProtectedRoute role="siswa">
                <DashboardSiswa />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ujian/:sessionId"
            element={
              <ProtectedRoute role="siswa">
                <UjianPage />
              </ProtectedRoute>
            }
          />

          {/* <Route
            path="/hasil"
            element={
              <ProtectedRoute role="siswa">
                <HasilPage />
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/guru"
            element={
              <ProtectedRoute role="guru">
                <DashboardGuru />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

//test tailwind dan daisy UI

//import React from "react";

// function App() {
//   return (
//     <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
//       <div className="card w-96 bg-base-100 shadow-xl">
//         <div className="card-body">
//           <h2 className="card-title text-primary font-bold text-2xl">Berhasil! 🎉</h2>
//           <p className="text-base-content">
//             Jika kamu melihat kartu ini dengan warna biru, berarti
//             <strong> Tailwind v4 + daisyUI </strong> sudah aktif.
//           </p>
//           <div className="card-actions justify-end mt-4">
//             <button className="btn btn-primary">Klik Saya</button>
//           </div>
//         </div>
//       </div>

//       <div className="flex gap-2 mt-6">
//         <div className="badge badge-secondary">React</div>
//         <div className="badge badge-accent">Vite</div>
//         <div className="badge badge-outline">Tailwind 4</div>
//       </div>
//     </div>
//   );
// }

// export default App;
