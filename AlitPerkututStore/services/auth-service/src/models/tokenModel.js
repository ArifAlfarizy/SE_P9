import db from "../configs/db.js";
const DB_NAME = "refresh_tokens";

export const findTokenByToken = async (token) => {
  const [rows] = await db.query(`SELECT * FROM ${DB_NAME}  WHERE token = ?`, [
    token,
  ]);
  return rows[0];
};

export const saveToken = async ({ user_id, token, expired_at }) => {
  const [result] = await db.query(
    `INSERT INTO ${DB_NAME} (user_id, token, expired_at)
     VALUES (?, ?, ?)`,
    [user_id, token, expired_at],
  );

  const [rows] = await db.query(
    `SELECT user_id, token, expired_at FROM ${DB_NAME} WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};
