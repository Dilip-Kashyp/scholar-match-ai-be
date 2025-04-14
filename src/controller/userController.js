import asyncHandler from "../utils/asyncHandler.js";
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
  RESPONSE_INTERNAL_SERVER_ERROR,
  RESPONSE_USER_CREATED,
  RESPONSE_USER_UPDATED,
  RESPONSE_USER_FETCH_SUCCESS,
  RESPONSE_USER_NOT_FOUND,
} from "../constants/constants.js";

import { models } from "../schema/index.js";

// User Registration
const userRegister = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: RESPONSE_FIELDS_REQUIRED });
  }

  try {
    const existingUser = await models.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: RESPONSE_USER_EXISTS });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await models.User.create({ email, password: hashedPassword, name });

    res.status(201).json({ message: RESPONSE_SUCCESS_REGISTER });
  } catch (error) {
    console.error(RESPONSE_ERROR_REGISTER, error.message);
    res.status(500).json({ message: RESPONSE_ERROR });
  }
});

// User Login
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: RESPONSE_FIELDS_REQUIRED });
  }

  try {
    const user = await models.User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: RESPONSE_USER_NOT_EXIST });
    }

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

    res.status(200).json({
      message: RESPONSE_LOGIN_SUCCESS,
      token,
    });
  } catch (error) {
    console.error(RESPONSE_ERROR_LOGIN, error.message);
    res.status(500).json({ message: RESPONSE_ERROR });
  }
});

// Get User Profile
const userProfile = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
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

// Create or Update User Profile
const userCreate = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      category,
      religious,
      gender,
      age,
      location,
      academicDetails,
    } = req.body;

    const [user, created] = await models.User.upsert(
      {
        name,
        email,
        category,
        religious,
        gender,
        age,
        location,
        academicDetails,
      },
      { returning: true }
    );

    return res.status(created ? 201 : 200).json({
      message: created ? RESPONSE_USER_CREATED : RESPONSE_USER_UPDATED,
      data: user,
    });
  } catch (error) {
    console.error("Error saving/updating user details:", error);
    return res.status(500).json({
      message: RESPONSE_INTERNAL_SERVER_ERROR,
    });
  }
});

// Get User By ID
const getUserById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.user;

    const user = await models.User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        message: RESPONSE_USER_NOT_FOUND,
      });
    }

    return res.status(200).json({
      message: RESPONSE_USER_FETCH_SUCCESS,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      message: RESPONSE_INTERNAL_SERVER_ERROR,
    });
  }
});

export { userRegister, userLogin, userProfile, userCreate, getUserById };
