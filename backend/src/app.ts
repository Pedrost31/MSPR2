import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import dotenv from "dotenv";

require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());
console.log("DB =", process.env.DATABASE_URL);
// routes
app.use("/api/users", userRoutes);

export default app;