import db from "../configs/db.js";

export const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

export const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};

export const createUser = async ({ name, email, password, role }) => {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, password, role],
  );

  const [rows] = await db.query(
    `SELECT id, name, email, role FROM users WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};

