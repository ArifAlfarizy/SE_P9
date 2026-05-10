import {
  findAllList,
  findListById,
  createList,
  updateList,
  deleteList,
} from "../models/listModel.js";

// Get all list
export const getAllListController = async (req, res) => {
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

// Get list by id
export const getListByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const list = await findListById(id);

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    return res.status(200).json({
      message: "List data",
      data: list,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const createListController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden access",
      });
    }

    const { name, species, gender, age_in_months, price, stock, status } =
      req.body;

    const newList = await createList({
      name,
      species,
      gender,
      age_in_months,
      price,
      stock,
      status,
    });

    return res.status(201).json({
      message: "List created successfully",
      data: newList,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const updateListController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden access",
      });
    }

    const { id } = req.params;

    const existingList = await findListById(id);

    if (!existingList) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    const updatedList = await updateList(id, req.body);

    return res.status(200).json({
      message: "List updated successfully",
      data: updatedList,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const deleteListController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden access",
      });
    }

    const { id } = req.params;

    const deletedList = await deleteList(id);

    if (!deletedList) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    return res.status(200).json({
      message: "List deleted successfully",
      data: deletedList,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
