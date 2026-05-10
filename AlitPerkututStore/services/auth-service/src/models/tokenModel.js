import db from "../configs/db.js";
const TABLE_NAME = "refresh_tokens";

export const findTokenByToken = async (token) => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME}  WHERE token = ?`, [
    token,
  ]);
  return rows[0];
};

export const saveToken = async ({ user_id, token, expired_at }) => {
  const [result] = await db.query(
    `INSERT INTO ${TABLE_NAME} (user_id, token, expired_at)
     VALUES (?, ?, ?)`,
    [user_id, token, expired_at],
  );

  const [rows] = await db.query(
    `SELECT user_id, token, expired_at FROM ${TABLE_NAME} WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};

export const deleteToken = async (token) => {
  await db.query(`DELETE FROM ${TABLE_NAME} WHERE token = ?`, [token]);
};

