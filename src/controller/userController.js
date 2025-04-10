import asyncHandler from "../utils/asyncHandler.js";
import db from "../database/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  RESPONSE_ERROR,
  RESPONSE_SUCCESS_REGISTER,
  RESPONSE_ERROR_REGISTER,
  RESPONSE_ERROR_LOGIN,
  RESPONSE_INVALID_CREDENTIALS,
  RESPONSE_LOGIN_SUCCESS,
  RESPONSE_FIELDS_REQUIRED,
  RESPONSE_USER_EXISTS,
  RESPONSE_USER_PROFILE,
  RESPONSE_USER_NOT_EXIST,
} from "../constants/constants.js";
import { models } from "../schema/index.js";

const userRegister = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: RESPONSE_FIELDS_REQUIRED });
  }

  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: RESPONSE_USER_EXISTS });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)",
      [email, hashedPassword, name]
    );

    res.status(201).json({ message: RESPONSE_SUCCESS_REGISTER });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: RESPONSE_ERROR });
  }
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: RESPONSE_FIELDS_REQUIRED });
  }

  try {
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: RESPONSE_USER_NOT_EXIST });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: RESPONSE_INVALID_CREDENTIALS });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "48h" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.json({
      message: RESPONSE_LOGIN_SUCCESS,
      token: token,
    });
  } catch (error) {
    console.error(RESPONSE_ERROR_LOGIN, error.message);
    res.status(500).json({ message: RESPONSE_ERROR });
  }
});

const userProfile = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    res.json({
      message: RESPONSE_USER_PROFILE,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: RESPONSE_ERROR });
  }
});

const userCreate = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      caste,
      religion,
      gender,
      age,
      location,
      academicDetails,
    } = req.body;

    if (!name || !email || !caste || !age) {
      return res.status(400).json({
        message: "Full name, email, caste, and age are required.",
      });
    }

    const newUser = await models.User.create({
      name,
      email,
      caste,
      religion,
      gender,
      age,
      location,
      academicDetails,
    });

    return res.status(201).json({
      message: "User details saved successfully.",
      data: newUser,
    });
  } catch (error) {
    console.error("Error saving user details:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
});

export { userRegister, userLogin, userProfile, userCreate };
