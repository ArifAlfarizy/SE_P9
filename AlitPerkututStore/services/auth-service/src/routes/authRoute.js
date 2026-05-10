import express from "express";
import {
  login,
  logout,
  refresh,
  register,
  registerAdmin,
} from "../controllers/authController.js";
import verifyToken from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/register-admin", registerAdmin);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);

export default authRouter;
