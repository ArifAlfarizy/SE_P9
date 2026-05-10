import express from "express";
import {
  createListController,
  deleteListController,
  getAllListController,
  getListByIdController,
  updateListController,
} from "../controllers/listController.js";

const listRouter = express.Router();

listRouter.get("/", getAllListController);
listRouter.get("/:id", getListByIdController);
listRouter.post("/", createListController);
listRouter.patch("/:id", updateListController);
listRouter.delete("/:id", deleteListController);

export default listRouter;
