import express from "express";
import {
  getAllOrdersController,
  getOrderByIdController,
  getMyOrdersController,
  createOrderController,
  cancelOrderController,
  completeOrderController,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.get("/", getAllOrdersController);
orderRouter.get("/my-orders", getMyOrdersController);
orderRouter.get("/:id", getOrderByIdController);
orderRouter.post("/", createOrderController);
orderRouter.patch("/:id/cancel", cancelOrderController);
orderRouter.patch("/:id/complete", completeOrderController);

export default orderRouter;