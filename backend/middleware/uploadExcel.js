import multer from "multer";
import path from "path";

// simpan di folder uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `soal-${Date.now()}${ext}`);
  },
});

// filter hanya excel
const fileFilter = (req, file, cb) => {
  const allowed = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.mimetype === "application/vnd.ms-excel";

  if (!allowed) {
    cb(new Error("File harus Excel (.xlsx / .xls)"), false);
  } else {
    cb(null, true);
  }
};

const uploadExcel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5MB
  },
});

export default uploadExcel;
