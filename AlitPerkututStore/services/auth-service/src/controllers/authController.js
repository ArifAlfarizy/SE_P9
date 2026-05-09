import bcrypt from "bcrypt";
import { createUser, findByEmail } from "../models/userModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtil.js";
import { deleteToken, saveToken } from "../models/tokenModel.js";
const saltRounds = Number(process.env.SALT_ROUNDS);

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Required fields: name, email, and password" });
    }

    const isUserExist = await findByEmail(email);

    if (isUserExist) {
      return res.status(409).json({
        message: "Email already registered. Try logging in with that email!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    const refreshExpiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await saveToken({
      user_id: newUser.id,
      token: refreshToken,
      expired_at: refreshExpiredAt,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(201).json({
      message: "Berhasil register",
      data: newUser,
      accessToken,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Register admin
export const registerAdmin = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ message: "Forbidden. Only owner can create " });
    }

    const adminRole = "admin";
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Required fields: name, email, and password" });
    }

    const isUserExist = await findByEmail(email);

    if (isUserExist) {
      return res.status(409).json({
        message: "Email already registered. Try logging in with that email!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = await createUser({
      name,
      email,
      password: hashedPassword,
      role: adminRole,
    });

    const accessToken = generateAccessToken(newAdmin);
    const refreshToken = generateRefreshToken(newAdmin);

    const refreshExpiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await saveToken({
      user_id: newAdmin.id,
      token: refreshToken,
      expired_at: refreshExpiredAt,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(201).json({
      message: "Berhasil register",
      data: newAdmin,
      accessToken,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password must be filled!",
      });
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "User not found. Try register!",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Wrong email or password",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const refreshExpiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await saveToken({
      user_id: user.id,
      token: refreshToken,
      expired_at: refreshExpiredAt,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Berhasil login",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const accessToken = req.cookies.accessToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    await deleteToken(refreshToken);

    res.clearCookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
