// Connecting to mysql database
import mysql from "mysql2/promise";
import "dotenv/config";

// Create the connection to database
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log("Connected to the MySQL server.");

export default connection;
