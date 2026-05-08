import bcrypt from "bcrypt";
import { createUser, findByEmail } from "../models/userModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtil.js";
import { saveToken } from "../models/tokenModel.js";
const saltRounds = Number(process.env.SALT_ROUNDS);

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
