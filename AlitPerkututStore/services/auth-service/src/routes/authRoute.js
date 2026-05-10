import express from "express";
import {
  login,
  logout,
  refresh,
  register,
  registerAdmin,
} from "../controllers/authController.js";
const authRouter = express.Router();

authRouter.post("/public/register", register);
authRouter.post("/admin/register", registerAdmin);
authRouter.post("/public/login", login);
authRouter.post("/public/logout", logout);
authRouter.post("/public/refresh", refresh);

export default authRouter;
