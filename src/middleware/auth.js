const asyncHandler = require("../utils/asyncHandler.js");
const db = require("../database/db.js"); 
const jwt = require("jsonwebtoken");
const { RESPONSE_UNAUTHORIZED } = require("../constants/constants");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or headers
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

    // Fetch user from PostgreSQL
    const result = await db.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [validateToken.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: RESPONSE_UNAUTHORIZED,
      });
    }


    // Attach user to the request object
    req.user = result.rows[0];

    next();
  } catch (error) {
    console.log("error", error)
    return res.status(401).json({
      message: RESPONSE_UNAUTHORIZED,
    });
  }
});


module.exports = { verifyJWT };
