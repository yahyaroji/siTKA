import API from "./axios";

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
