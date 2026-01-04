import API from "./axios"; // axios instance

export const getAllSiswa = () => {
  return API.get("/guru/siswa");
};

export const getSiswaWithResult = (stage) => {
  return API.get(`/guru/siswa-result?stage=${stage}`);
};

export const verifySiswa = (id, payload) => {
  return API.patch(`/guru/siswa/${id}/verify`, payload);
};

// ================== MANAJEMEN USER ==================
// CRUD siswa
export const createSiswa = (data) => API.post("/guru/siswa", data);
export const updateSiswa = (id, data) => API.put(`/guru/siswa/${id}`, data);
export const deleteSiswa = (id) => API.delete(`/guru/siswa/${id}`);

// upload excel
export const uploadSiswaExcel = (formData) =>
  API.post("/guru/siswa/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ================== END MANAJEMEN USER ==================

// ================== SOAL ==================

// get list soal (pagination + filter)
export const getSoalList = ({ mapel, stage, page = 1, limit = 10 }) => {
  return API.get("/guru/soal", {
    params: { mapel, stage, page, limit },
  });
};

// delete soal
export const deleteSoal = (id) => {
  return API.delete(`/guru/soal/${id}`);
};

// update soal atau edit soal
export const updateSoal = (id, payload) => {
  return API.put(`/guru/soal/${id}`, payload);
};

//tambah soal
export const createSoal = (payload) => {
  return API.post("/guru/soal", payload);
};
//upload soal excel
export const uploadSoalExcel = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post("/guru/soal/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
