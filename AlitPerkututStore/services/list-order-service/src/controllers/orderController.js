import {
  findAllOrders,
  findOrderById,
  findOrdersByCustomerId,
  createOrder,
  cancelOrder,
  completeOrder,
  findOrdersByStatus,
} from "../models/orderModel.js";
import { publish } from "../messaging/publisher.js";

// Get all orders — admin only
export const getAllOrdersController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role !== "admin") {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const { status } = req.query;

    // Filter by status if provided as query param e.g. ?status=ongoing
    const orders = status
      ? await findOrdersByStatus(status)
      : await findAllOrders();

    return res.status(200).json({
      message: "Orders data",
      data: orders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get order by id — admin only
export const getOrderByIdController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role !== "admin") {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const { id } = req.params;
    const order = await findOrderById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order data",
      data: order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get orders belonging to the logged-in user — user only
export const getMyOrdersController = async (req, res) => {
  try {
    const customer_id = req.headers["x-user-id"];

    if (!customer_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await findOrdersByCustomerId(customer_id);

    return res.status(200).json({
      message: "My orders data",
      data: orders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Create order — user only
export const createOrderController = async (req, res) => {
  try {
    const customer_id = req.headers["x-user-id"];

    if (!customer_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      customer_name,
      customer_phone,
      customer_address,
      payment_method,
      notes,
      cod_schedule_at,
      items,
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_phone || !customer_address) {
      return res.status(400).json({
        message:
          "customer_name, customer_phone, and customer_address are required",
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must have at least one item",
      });
    }

    for (const item of items) {
      if (!item.list_id || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message:
            "Each item must have a valid list_id and quantity of at least 1",
        });
      }
    }

    const newOrder = await createOrder({
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      payment_method,
      notes,
      cod_schedule_at,
      items,
    });

    // Publish event async
    publish("order.created", {
      orderId: newOrder.id,
      customerId: newOrder.customer_id,
      customerName: newOrder.customer_name,
      totalPrice: newOrder.total_price,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (err) {
    console.error(err);

    // Distinguish business logic errors from server errors
    const knownErrors = ["is not available", "Insufficient stock"];
    const isKnown = knownErrors.some((e) => err.message.includes(e));

    return res.status(isKnown ? 400 : 500).json({
      message: isKnown ? err.message : "Internal server error",
      error: isKnown ? undefined : err.message,
    });
  }
};

// Cancel order — user (own order) or admin
export const cancelOrderController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];
    const customer_id = req.headers["x-user-id"];
    const { id } = req.params;

    const existing = await findOrderById(id);

    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Users can only cancel their own orders
    if (
      role !== "admin" &&
      String(existing.customer_id) !== String(customer_id)
    ) {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const canceled = await cancelOrder(id);

    return res.status(200).json({
      message: "Order canceled successfully",
      data: canceled,
    });
  } catch (err) {
    console.error(err);

    const isKnown = err.message.includes("cannot be canceled");

    return res.status(isKnown ? 400 : 500).json({
      message: isKnown ? err.message : "Internal server error",
      error: isKnown ? undefined : err.message,
    });
  }
};

// Complete order — admin only
export const completeOrderController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role !== "admin") {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const { id } = req.params;

    const existing = await findOrderById(id);

    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    const completed = await completeOrder(id);

    return res.status(200).json({
      message: "Order completed successfully",
      data: completed,
    });
  } catch (err) {
    console.error(err);

    const isKnown = err.message.includes("cannot be completed");

    return res.status(isKnown ? 400 : 500).json({
      message: isKnown ? err.message : "Internal server error",
      error: isKnown ? undefined : err.message,
    });
  }
};
