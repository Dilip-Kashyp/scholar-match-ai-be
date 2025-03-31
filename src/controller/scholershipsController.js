import db from "../database/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  RESPONSE_ERROR,
  RESPONSE_SUCCESS_FETCH_SCHOLARSHIPS,
  RESPONSE_SUCCESS_APPLY_SCHOLARSHIP,
  RESPONSE_NO_SCHOLARSHIPS_FOUND,
  RESPONSE_NO_SCHOLARSHIPS_APPLIED,
  RESPONSE_FIELDS_REQUIRED,
} from "../constants/constants.js";
import { generateSQLQuery } from "../ai/genai.js";
import { models } from "../schema/index.js";

const getAllScholarships = asyncHandler(async (req, res) => {
  try {
    const { searchQuery } = req.body;
    let scholarships;

    if (searchQuery) {
      const sqlQuery = await generateSQLQuery(searchQuery);
      console.log(sqlQuery);
      const results = await db.query(sqlQuery);
      scholarships = results.rows;
    } else {
      const results = await db.query(
        "SELECT * FROM scholarships  ORDER BY deadline ASC, amount DESC"
      );
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

const applyScholarship = asyncHandler(async (req, res) => {
  try {
    const { scholarship_id } = req.body;
    const user_id = req.user.id;

    if (!scholarship_id) {
      return res.status(400).json({ message: RESPONSE_FIELDS_REQUIRED });
    }
    const scholarship = await models.Scholarship.findByPk(scholarship_id);
    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    const alreadyApplied = await models.Application.findOne({
      where: { userId: user_id, scholarshipId: scholarship_id },
    });

    if (alreadyApplied) {
      return res.status(400).json({
        message: "You have already applied for this scholarship.",
      });
    }

    const newApplication = await models.Application.create({
      userId: user_id,
      scholarshipId: scholarship_id,
      status: "pending",
    });

    res.status(201).json({
      data: newApplication,
      message: "Successfully applied for the scholarship.",
    });
  } catch (error) {
    console.error("Error applying for scholarship:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

const overallInformation = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Count total applications
    const totalApplications = await models.Application.count({
      where: { userId: userId },
    });

    // Count approved applications
    const approvedApplications = await models.Application.count({
      where: { userId: userId, status: "approved" },
    });

    // Count pending applications
    const pendingApplications = await models.Application.count({
      where: { userId: userId, status: "pending" },
    });

    // Return the response
    res.status(200).json({
      message: "Application statistics fetched successfully.",
      data: {
        totalApplications,
        approvedApplications,
        pendingApplications,
      },
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

const getAllAppliedScholarships = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await models.Application.findAll({
      where: { userId: userId },
      include: [
        {
          model: models.Scholarship,
          as: models.Scholarship,
          attributes: ["id", "name", "amount"],
        },
      ],
    });

    if (!applications.length) {
      return res.status(404).json({
        message: "No scholarships applied yet.",
        data: [],
      });
    }

    res.status(200).json({
      message: "Applied scholarships retrieved successfully.",
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applied scholarships:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export {
  getAllScholarships,
  applyScholarship,
  overallInformation,
  getAllAppliedScholarships,
};
