import db from "../configs/db.js";
const TABLE_NAME = "list";

export const findAllList = async () => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME}`);
  return rows;
};

export const findListById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [
    id,
  ]);
  return rows[0];
};

export const createList = async ({
  name,
  species,
  gender,
  age_in_months,
  price,
  stock,
  status,
}) => {
  const [result] = await db.query(
    `INSERT INTO ${TABLE_NAME} 
    (
      name,
      species,
      gender,
      age_in_months,
      price,
      stock,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, species, gender, age_in_months, price, stock, status],
  );

  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [
    result.insertId,
  ]);

  return rows[0];
};

export const updateList = async (
  id,
  { name, species, gender, age_in_months, price, stock, status },
) => {
  await db.query(
    `UPDATE ${TABLE_NAME}
     SET
      name = ?,
      species = ?,
      gender = ?,
      age_in_months = ?,
      price = ?,
      stock = ?,
      status = ?
     WHERE id = ?`,
    [name, species, gender, age_in_months, price, stock, status, id],
  );

  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [
    id,
  ]);

  return rows[0];
};

export const deleteList = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [
    id,
  ]);

  if (rows.length === 0) {
    return null;
  }

  await db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);

  return rows[0];
};
