import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api",
  // baseURL: "/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // ambil token yang benar

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default instance;
