import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  //ditambahkan
  // console.log("--- MASUK MIDDLEWARE ---");
  // const authHeader = req.headers.authorization;

  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   console.log("Error: Header Authorization tidak valid");
  //   return res.status(400).json({ message: "Format Header Auth Salah" });
  // }
  //sampai sini ditambahkan

  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // simpan data user ke req agar bisa dipakai controller
    //console.log("token berhasil di verifikasi:", decoded);
    next();
  } catch (err) {
    // console.log("error token salah atau expired:");
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

export default authMiddleware;
