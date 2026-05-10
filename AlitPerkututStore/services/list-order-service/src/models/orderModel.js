import db from "../configs/db.js";

const ORDER_TABLE = "orders";
const ORDER_ITEMS_TABLE = "order_items";
const LIST_TABLE = "list";

// Generate order number: ORD-YYYYMMDD-XXXX
const generateOrderNumber = () => {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ymd}-${rand}`;
};

export const findAllOrders = async () => {
  const [rows] = await db.query(`
    SELECT 
      o.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', oi.id,
          'list_id', oi.list_id,
          'name', l.name,
          'species', l.species,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS items
    FROM ${ORDER_TABLE} o
    LEFT JOIN ${ORDER_ITEMS_TABLE} oi ON oi.order_id = o.id
    LEFT JOIN ${LIST_TABLE} l ON l.id = oi.list_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `);
  return rows;
};

export const findOrderById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT 
      o.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', oi.id,
          'list_id', oi.list_id,
          'name', l.name,
          'species', l.species,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS items
    FROM ${ORDER_TABLE} o
    LEFT JOIN ${ORDER_ITEMS_TABLE} oi ON oi.order_id = o.id
    LEFT JOIN ${LIST_TABLE} l ON l.id = oi.list_id
    WHERE o.id = ?
    GROUP BY o.id
  `,
    [id]
  );
  return rows[0];
};

export const findOrderByNumber = async (order_number) => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} WHERE order_number = ?`,
    [order_number]
  );
  return rows[0];
};

// Get all orders belonging to a specific customer
export const findOrdersByCustomerId = async (customer_id) => {
  const [rows] = await db.query(
    `
    SELECT 
      o.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', oi.id,
          'list_id', oi.list_id,
          'name', l.name,
          'species', l.species,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS items
    FROM ${ORDER_TABLE} o
    LEFT JOIN ${ORDER_ITEMS_TABLE} oi ON oi.order_id = o.id
    LEFT JOIN ${LIST_TABLE} l ON l.id = oi.list_id
    WHERE o.customer_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `,
    [customer_id]
  );
  return rows;
};

// items: [{ list_id, quantity }]
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
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Validate stock availability and calculate total
    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      // Lock the row to prevent race conditions
      const [listRows] = await conn.query(
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

    // Insert the order
    const [orderResult] = await conn.query(
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

    // Insert order items and deduct stock
    for (const item of resolvedItems) {
      await conn.query(
        `INSERT INTO ${ORDER_ITEMS_TABLE} (order_id, list_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [order_id, item.list_id, item.quantity, item.price]
      );

      const newStock = item.listItem.stock - item.quantity;

      // Mark as sold if stock reaches zero
      await conn.query(
        `UPDATE ${LIST_TABLE} SET stock = ?, status = IF(? <= 0, 'sold', 'available') WHERE id = ?`,
        [newStock, newStock, item.list_id]
      );
    }

    await conn.commit();

    return findOrderById(order_id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const cancelOrder = async (id) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT * FROM ${ORDER_TABLE} WHERE id = ?`,
      [id]
    );
    const order = rows[0];

    if (!order) return null;

    if (order.status !== "ongoing") {
      throw new Error(`Order cannot be canceled, current status: ${order.status}`);
    }

    // Restore stock for each item
    const [items] = await conn.query(
      `SELECT * FROM ${ORDER_ITEMS_TABLE} WHERE order_id = ?`,
      [id]
    );

    for (const item of items) {
      await conn.query(
        `UPDATE ${LIST_TABLE} 
         SET stock = stock + ?, status = 'available'
         WHERE id = ?`,
        [item.quantity, item.list_id]
      );
    }

    // Update order status to canceled
    await conn.query(
      `UPDATE ${ORDER_TABLE} SET status = 'canceled', canceled_at = NOW() WHERE id = ?`,
      [id]
    );

    await conn.commit();

    return findOrderById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const completeOrder = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${ORDER_TABLE} WHERE id = ?`,
    [id]
  );
  const order = rows[0];

  if (!order) return null;

  if (order.status !== "ongoing") {
    throw new Error(`Order cannot be completed, current status: ${order.status}`);
  }

  // Update order status to done
  await db.query(
    `UPDATE ${ORDER_TABLE} SET status = 'done', completed_at = NOW() WHERE id = ?`,
    [id]
  );

  return findOrderById(id);
};

export const findOrdersByStatus = async (status) => {
  const [rows] = await db.query(
    `
    SELECT 
      o.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', oi.id,
          'list_id', oi.list_id,
          'name', l.name,
          'species', l.species,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS items
    FROM ${ORDER_TABLE} o
    LEFT JOIN ${ORDER_ITEMS_TABLE} oi ON oi.order_id = o.id
    LEFT JOIN ${LIST_TABLE} l ON l.id = oi.list_id
    WHERE o.status = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `,
    [status]
  );
  return rows;
};