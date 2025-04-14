import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { RESPONSE_UNAUTHORIZED } from "../constants/constants.js";
import { models } from "../schema/index.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: RESPONSE_UNAUTHORIZED,
      });
    }

    // Verify the token
    const validateToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const result = await models.User.findOne({
      where: { id: validateToken.id },
      attributes: ["id", "email"],
    });

    if (typeof result.dataValues === "string") {
      return res.status(401).json({
        message: RESPONSE_UNAUTHORIZED,
      });
    }

    req.user = result.dataValues;

    next();
  } catch (error) {
    console.log("error", error);
    return res.status(401).json({
      message: RESPONSE_UNAUTHORIZED,
    });
  }
});

export default verifyJWT;
