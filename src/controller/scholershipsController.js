const Scholarship = require("../schema/scholershipSchema");
const db = require("../database/db");
const asyncHandler = require("../utils/asyncHandler");
const {
  RESPONSE_ERROR,
  RESPONSE_SUCCESS_FETCH_SCHOLARSHIPS,
  RESPONSE_SUCCESS_APPLY_SCHOLARSHIP,
  RESPONSE_NO_SCHOLARSHIPS_FOUND,
} = require("../constants/constants");

const getAllScholarships = asyncHandler(async (req, res) => {
  try {
    const scholarships = await db.query("SELECT * FROM scholarships");

    if (!scholarships) {
      return res.status(404).json({
        message: RESPONSE_NO_SCHOLARSHIPS_FOUND,
      });
    }

    res.status(200).json({
      message: RESPONSE_SUCCESS_FETCH_SCHOLARSHIPS,
      data: scholarships.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: RESPONSE_ERROR,
      error: error.message,
    });
  }
});

function applyScholarship(req, res) {
  res.status(200).json({
    message: RESPONSE_SUCCESS_APPLY_SCHOLARSHIP,
  });
}

module.exports = {
  getAllScholarships,
  applyScholarship,
};
