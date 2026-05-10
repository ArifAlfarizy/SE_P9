import { findAllList } from "../models/listModel.js";

// Get all list
export const getAllList = async (req, res) => {
  try {
    const lists = await findAllList();

    return res.status(200).json({
      message: "Lists data",
      data: lists,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// 