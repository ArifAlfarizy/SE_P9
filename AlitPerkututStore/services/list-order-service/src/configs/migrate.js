// Migrate for creating database and tabels
import mysql from "mysql2/promise";
import "dotenv/config";

async function migrate() {
  let connection;

  try {
    // DB connection without db name
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log(`Connected!`);

    // Create database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
    );
    console.log("Database ready");

    // Use database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Creating list table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        species VARCHAR(100) NOT NULL,
        gender ENUM('male', 'female') NOT NULL,  
        age_in_months INT DEFAULT 0, 
        price DECIMAL(12,2) NOT NULL,
        stock INT DEFAULT 1,
        status ENUM('available', 'sold') DEFAULT 'available',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(`List table is ready`);

    // Creating order table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(100) NOT NULL UNIQUE,
        customer_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(30) NOT NULL,
        customer_address TEXT NOT NULL,
        payment_method ENUM('cod') DEFAULT 'cod',
        status ENUM('ongoing', 'canceled', 'done') DEFAULT 'ongoing',
        total_amount DECIMAL(12,2) DEFAULT 0,
        notes TEXT NULL,
        cod_schedule_at DATETIME NULL,
        completed_at DATETIME NULL,
        canceled_at DATETIME NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
      `);

    console.log(`Orders table ready`);

    // Creating order items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        list_id INT NOT NULL,
        quantity INT DEFAULT 1,
        price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (list_id) REFERENCES list(id)
        )
        `);

    console.log(`Order items table ready`);

    console.log(`Migrate success!`);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
