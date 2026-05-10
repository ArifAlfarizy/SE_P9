import express from "express";
import { getAllList } from "../controllers/listController.js";

const listRouter = express.Router();

listRouter.get("/", getAllList);

export default listRouter;
