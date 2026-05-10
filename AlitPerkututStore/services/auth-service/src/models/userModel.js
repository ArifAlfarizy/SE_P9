import db from "../configs/db.js"
const TABLE_NAME = "users";

export const findByEmail = async (email) => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE email = ?`, [
    email,
  ]);
  return rows[0];
};

export const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
  return rows[0];
};

export const createUser = async ({ name, email, password, role = "user" }) => {
  const [result] = await db.query(
    `INSERT INTO ${TABLE_NAME} (name, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, password, role],
  );

  const [rows] = await db.query(
    `SELECT id, name, email, role FROM ${TABLE_NAME} WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};
