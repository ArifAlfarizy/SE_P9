import db from "../configs/db.js"
const DB_NAME = "users";

export const findByEmail = async (email) => {
  const [rows] = await db.query(`SELECT * FROM ${DB_NAME} WHERE email = ?`, [
    email,
  ]);
  return rows[0];
};

export const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ${DB_NAME} WHERE id = ?`, [id]);
  return rows[0];
};

export const createUser = async ({ name, email, password, role = "user" }) => {
  const [result] = await db.query(
    `INSERT INTO ${DB_NAME} (name, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, password, role],
  );

  const [rows] = await db.query(
    `SELECT id, name, email, role FROM ${DB_NAME} WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};
