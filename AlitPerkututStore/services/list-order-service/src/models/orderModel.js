import db from "../configs/db.js";

const ORDER_TABLE = "orders";
const ORDER_ITEMS_TABLE = "order_items";
const LIST_TABLE = "list";

const generateOrderNumber = () => {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ymd}-${rand}`;
};

// Ambil items dari order tertentu
const getOrderItems = async (order_id) => {
  const [rows] = await db.query(
    `SELECT oi.id, oi.list_id, oi.quantity, oi.price, l.name, l.species
     FROM ${ORDER_ITEMS_TABLE} oi
     LEFT JOIN ${LIST_TABLE} l ON l.id = oi.list_id
     WHERE oi.order_id = ?`,
    [order_id]
  );
  return rows;
};

// Gabungkan orders dengan items-nya
const attachItems = async (orders) => {
  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      items: await getOrderItems(order.id),
    }))
  );
};

export const findAllOrders = async () => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} ORDER BY created_at DESC`
  );
  return attachItems(rows);
};

export const findOrderById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const items = await getOrderItems(id);
  return { ...rows[0], items };
};

export const findOrderByNumber = async (order_number) => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} WHERE order_number = ?`,
    [order_number]
  );
  return rows[0] || null;
};

export const findOrdersByStatus = async (status) => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} WHERE status = ? ORDER BY created_at DESC`,
    [status]
  );
  return attachItems(rows);
};

export const findOrdersByCustomerId = async (customer_id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} WHERE customer_id = ? ORDER BY created_at DESC`,
    [customer_id]
  );
  return attachItems(rows);
};

export const createOrder = async ({
  customer_id,
  customer_name,
  customer_phone,
  customer_address,
  payment_method = "cod",
  notes,
  cod_schedule_at,
  items,
}) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const [listRows] = await connection.query(
        `SELECT * FROM ${LIST_TABLE} WHERE id = ? AND status = 'available' FOR UPDATE`,
        [item.list_id]
      );

      const listItem = listRows[0];

      if (!listItem) {
        throw new Error(`Item with id ${item.list_id} is not available`);
      }

      if (listItem.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${listItem.name} (available: ${listItem.stock})`
        );
      }

      total_amount += listItem.price * item.quantity;
      resolvedItems.push({ ...item, price: listItem.price, listItem });
    }

    const order_number = generateOrderNumber();

    const [orderResult] = await connection.query(
      `INSERT INTO ${ORDER_TABLE} 
        (customer_id, order_number, customer_name, customer_phone, customer_address, payment_method, notes, cod_schedule_at, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        order_number,
        customer_name,
        customer_phone,
        customer_address,
        payment_method,
        notes || null,
        cod_schedule_at || null,
        total_amount,
      ]
    );

    const order_id = orderResult.insertId;

    for (const item of resolvedItems) {
      await connection.query(
        `INSERT INTO ${ORDER_ITEMS_TABLE} (order_id, list_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [order_id, item.list_id, item.quantity, item.price]
      );

      const newStock = item.listItem.stock - item.quantity;
      await connection.query(
        `UPDATE ${LIST_TABLE} SET stock = ?, status = IF(? <= 0, 'sold', 'available') WHERE id = ?`,
        [newStock, newStock, item.list_id]
      );
    }

    await connection.commit();
    return findOrderById(order_id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const cancelOrder = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT * FROM ${ORDER_TABLE} WHERE id = ?`,
      [id]
    );
    const order = rows[0];

    if (!order) return null;

    if (order.status !== "ongoing") {
      throw new Error(`Order cannot be canceled, current status: ${order.status}`);
    }

    const [items] = await connection.query(
      `SELECT * FROM ${ORDER_ITEMS_TABLE} WHERE order_id = ?`,
      [id]
    );

    for (const item of items) {
      await connection.query(
        `UPDATE ${LIST_TABLE} SET stock = stock + ?, status = 'available' WHERE id = ?`,
        [item.quantity, item.list_id]
      );
    }

    await connection.query(
      `UPDATE ${ORDER_TABLE} SET status = 'canceled', canceled_at = NOW() WHERE id = ?`,
      [id]
    );

    await connection.commit();
    return findOrderById(id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const completeOrder = async (id) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT * FROM ${ORDER_TABLE} WHERE id = ?`,
      [id]
    );
    const order = rows[0];

    if (!order) return null;

    if (order.status !== "ongoing") {
      throw new Error(`Order cannot be completed, current status: ${order.status}`);
    }

    await connection.query(
      `UPDATE ${ORDER_TABLE} SET status = 'done', completed_at = NOW() WHERE id = ?`,
      [id]
    );

    return findOrderById(id);
  } finally {
    connection.release();
  }
};