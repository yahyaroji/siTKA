import axios from "./axios";

export async function getProfile(id) {
  const res = await axios.get(`/auth/profile/${id}`);
  return res.data;
}
