import API from "./axios";

export async function apiLogin(nis, password) {
  const res = await API.post("/auth/login", { nis, password });

  // Axios mengembalikan data di dalam properti .data
  return res.data;
}
