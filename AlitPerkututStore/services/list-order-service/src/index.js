import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import listRouter from "./routes/listRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { connectPublisher } from "./messaging/publisher.js";
import { startConsumer } from "./messaging/consumer.js";
const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/list", listRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("auth-service");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);

  await connectPublisher();
  await startConsumer();
});
