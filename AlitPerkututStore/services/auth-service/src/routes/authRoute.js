import express from "express";
import { login, logout, register, registerAdmin } from "../controllers/authController.js";
import verifyToken from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/registeradmin", verifyToken, registerAdmin);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

export default authRouter;
