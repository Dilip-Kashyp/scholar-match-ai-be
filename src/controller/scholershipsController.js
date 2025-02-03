import { runSearch } from "../ai/index.js";
import db from "../database/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  RESPONSE_ERROR,
  RESPONSE_SUCCESS_FETCH_SCHOLARSHIPS,
  RESPONSE_SUCCESS_APPLY_SCHOLARSHIP,
  RESPONSE_NO_SCHOLARSHIPS_FOUND,
} from "../constants/constants.js";

function formatAISearchResults(scholarships) {
  return scholarships.map((scholarship) => ({
    id: scholarship.id,
    name: scholarship.name,
    description: scholarship.description,
    amount: scholarship.amount,
    location: scholarship.location,
    type: scholarship.type,
    religious: scholarship.religious,
    gender: scholarship.gender,
    category: scholarship.category,
    institution_name: scholarship.institution_name,
    deadline: scholarship.deadline,
    income: scholarship.income,
    min_age: scholarship.min_age,
    max_age: scholarship.max_age,
    disability: scholarship.disability,
    ex_service: scholarship.ex_service,
    is_active: scholarship.is_active
  }));
}

const getAllScholarships = asyncHandler(async (req, res) => {
  try {
    const { searchQuery } = req.body;
    let scholarships;

    if (searchQuery) {
      const aiResults = await runSearch(searchQuery);
      scholarships = formatAISearchResults(aiResults);
    } else {
      const results = await db.query("SELECT * FROM scholarships");
      scholarships = results.rows;
    }

    if (!scholarships || scholarships.length === 0) {
      return res.status(404).json({
        success: false,
        message: RESPONSE_NO_SCHOLARSHIPS_FOUND,
      });
    }

    res.status(200).json({
      success: true,
      message: RESPONSE_SUCCESS_FETCH_SCHOLARSHIPS,
      data: scholarships,
    });
  } catch (error) {
    console.error("Error in getAllScholarships:", error);
    res.status(500).json({
      success: false,
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

export { getAllScholarships, applyScholarship };
