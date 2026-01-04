import axios from "axios";

const API = axios.create({
  // kalau pakai develop di lokal,
  baseURL: "http://127.0.0.1:5000/api",
  //dibawah ini nyobain online project lewat cloudflare tunnel
  // baseURL: "/api",
});

// otomatis pasang token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  //console.log("Exam API - Token:", token);
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const startExam = async (stage) => {
  const res = await API.post("/exam/start", { stage });
  return res.data;
};

export const getSoalBySession = async (sessionId) => {
  const res = await API.get(`/exam/session/${sessionId}/soal`);
  return res.data;
};

export const getMyResult = () => {
  return API.get("/exam-result/me");
};

export const getActiveSession = async () => {
  const res = await API.get("/exam/active-session");
  return res.data;
};

export default API;
