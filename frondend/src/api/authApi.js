export async function apiLogin(nis, password) {
  const res = await fetch("http://localhost:5000/api/auth/login", {
    // const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nis, password }),
  });

  return res.json();
}
