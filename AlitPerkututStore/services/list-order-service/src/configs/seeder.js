import mysql from "mysql2/promise";
import "dotenv/config";

async function seed() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Connected!");

    // Seeding list table
    const lists = [
      { name: "Kiko", species: "Lovebird", gender: "male", age_in_months: 6, price: 350000, stock: 5, status: "available" },
      { name: "Sari", species: "Kenari", gender: "female", age_in_months: 8, price: 200000, stock: 3, status: "available" },
      { name: "Rio", species: "Murai Batu", gender: "male", age_in_months: 12, price: 1500000, stock: 2, status: "available" },
      { name: "Cici", species: "Parkit", gender: "female", age_in_months: 4, price: 150000, stock: 10, status: "available" },
      { name: "Gagah", species: "Cucak Rowo", gender: "male", age_in_months: 18, price: 2500000, stock: 1, status: "available" },
      { name: "Pipi", species: "Pleci", gender: "female", age_in_months: 5, price: 100000, stock: 8, status: "available" },
      { name: "Sultan", species: "Kacer", gender: "male", age_in_months: 24, price: 800000, stock: 3, status: "available" },
      { name: "Nuri", species: "Nuri Kepala Hitam", gender: "female", age_in_months: 10, price: 3000000, stock: 2, status: "available" },
    ];

    for (const item of lists) {
      await connection.query(
        `INSERT INTO list (name, species, gender, age_in_months, price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.name, item.species, item.gender, item.age_in_months, item.price, item.stock, item.status]
      );
    }

    console.log("List table seeded!");

    // Seeding orders table
    const orders = [
      {
        customer_id: 1,
        order_number: "ORD-20250501-1001",
        customer_name: "Andi Pratama",
        customer_phone: "081234567890",
        customer_address: "Jl. Sudirman No. 10, Jakarta",
        payment_method: "cod",
        status: "ongoing",
        total_amount: 350000,
        notes: "Tolong dibungkus rapi",
        cod_schedule_at: "2025-05-15 10:00:00",
        completed_at: null,
        canceled_at: null,
      },
      {
        customer_id: 2,
        order_number: "ORD-20250502-1002",
        customer_name: "Siti Rahayu",
        customer_phone: "089876543210",
        customer_address: "Jl. Gatot Subroto No. 5, Bandung",
        payment_method: "cod",
        status: "done",
        total_amount: 200000,
        notes: null,
        cod_schedule_at: "2025-04-20 14:00:00",
        completed_at: "2025-04-20 15:30:00",
        canceled_at: null,
      },
      {
        customer_id: 3,
        order_number: "ORD-20250503-1003",
        customer_name: "Budi Santoso",
        customer_phone: "085678901234",
        customer_address: "Jl. Merpati No. 3, Surabaya",
        payment_method: "cod",
        status: "canceled",
        total_amount: 1500000,
        notes: "Minta diantar pagi",
        cod_schedule_at: "2025-04-25 09:00:00",
        completed_at: null,
        canceled_at: "2025-04-24 08:00:00",
      },
    ];

    for (const order of orders) {
      const [result] = await connection.query(
        `INSERT INTO orders 
          (customer_id, order_number, customer_name, customer_phone, customer_address, payment_method, status, total_amount, notes, cod_schedule_at, completed_at, canceled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.customer_id,
          order.order_number,
          order.customer_name,
          order.customer_phone,
          order.customer_address,
          order.payment_method,
          order.status,
          order.total_amount,
          order.notes,
          order.cod_schedule_at,
          order.completed_at,
          order.canceled_at,
        ]
      );

      // Seeding order items table
      const itemsMap = {
        "ORD-20250501-1001": [{ list_id: 1, quantity: 1, price: 350000 }],
        "ORD-20250502-1002": [{ list_id: 2, quantity: 1, price: 200000 }],
        "ORD-20250503-1003": [{ list_id: 3, quantity: 1, price: 1500000 }],
      };

      const orderItems = itemsMap[order.order_number] || [];

      for (const item of orderItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, list_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [result.insertId, item.list_id, item.quantity, item.price]
        );
      }
    }

    console.log("Orders table seeded!");
    console.log("Order items table seeded!");

    console.log("Seed success!");
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}

seed();