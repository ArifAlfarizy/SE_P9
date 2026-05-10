import express from "express";
import "dotenv/config";
import authRouter from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("auth-service");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
