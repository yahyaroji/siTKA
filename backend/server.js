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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
//====baruuu====
//untuk login
app.use("/api/auth", authRoutes);
//route yang harus login
app.use("/api/exam", authMiddleware, examRoutes);
app.use("/api/exam-result", authMiddleware, examResultRoutes);
app.use("/api/guru", guruRoutes);

//====end baruuu====

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend OK");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
