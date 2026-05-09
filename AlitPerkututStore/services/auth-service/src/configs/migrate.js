// Migrate for creating database and tabels
import mysql from "mysql2/promise";
import "dotenv/config";
import bcrypt from "bcrypt";
const saltRounds = Number(process.env.SALT_ROUNDS);

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

    // Creating users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        role ENUM('user','owner', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(`Users tabel ready`);

    // Creating refresh tokens table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token TEXT NOT NULL,
        expired_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("token_blacklist table ready");

    // Creating first admin (to create another admin)

    // Check existing
    const [rows] = await connection.query(
      `SELECT * FROM users WHERE role = 'owner' LIMIT 1`,
    );

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      saltRounds,
    );

    if (rows.length === 0) {
      // Insert admin
      await connection.query(
        `
     INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, ?)
      `,
        ["Super Admin", process.env.ADMIN_EMAIL, hashedPassword, "owner"],
      );

      console.log("First admin created!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
