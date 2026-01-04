import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
//baruu
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import examResultRoutes from "./routes/examResultRoutes.js";
import guruRoutes from "./routes/guruRoutes.js";

//lamaa
// import soalRoutes from "./routes/soalRoutes.js";
// import ujianRoutes from "./routes/ujianRoutes.js";

dotenv.config();

const app = express();
//untuk chek rute error
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });
//sampai sini untuk chek rute error

app.use(cors());
app.use(express.json());
//====baruuu====
//untuk login
app.use("/api/auth", authRoutes);
//route yang harus login
app.use("/api/exam", authMiddleware, examRoutes);
app.use("/api/exam-result", authMiddleware, examResultRoutes);
app.use("/api/guru", authMiddleware, guruRoutes);

//====end baruuu====

// app.use("/api/ranking", authMiddleware, examRoutes);

///lamaaa
// app.use("/api/ujian", soalRoutes);
// app.use("/api/ujian", ujianRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.listen(5000, () => console.log("Server running on 5000"));
