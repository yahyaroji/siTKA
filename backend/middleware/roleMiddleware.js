// middleware/roleMiddleware.js
//mencegah siswa masuk menu guru

export const roleMiddleware = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
};
