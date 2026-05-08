import express from "express";
import "dotenv/config";
const PORT = process.env.PORT || 4098;

const app = express();

app.get("/", (req, res) => {
  res.send("auth-service");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
