import db from "../database/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  RESPONSE_ERROR,
  RESPONSE_SUCCESS_FETCH_SCHOLARSHIPS,
  RESPONSE_SUCCESS_APPLY_SCHOLARSHIP,
  RESPONSE_NO_SCHOLARSHIPS_FOUND,
  RESPONSE_NO_SCHOLARSHIPS_APPLIED,
  RESPONSE_FIELDS_REQUIRED,
  RESPONSE_SCHOLARSHIP_NOT_FOUND,
  RESPONSE_ALREADY_APPLIED,
  RESPONSE_SUCCESS_APPLICATION_STATS,
  RESPONSE_SUCCESS_RETRIEVE_APPLIED,
  RESPONSE_COMPLETE_PROFILE,
  RESPONSE_SUCCESS_PERSONALIZED,
  RESPONSE_INTERNAL_SERVER_ERROR,
} from "../constants/constants.js";

import { generateSQLQuery } from "../ai/genai.js";
import { models } from "../schema/index.js";
import { Op } from "sequelize";

const getAllScholarships = asyncHandler(async (req, res) => {
  try {
    const { searchQuery } = req.body;
    let scholarships;

    if (searchQuery) {
      console.log("search", searchQuery);
      const sqlQuery = await generateSQLQuery(searchQuery);
      console.log("Generated SQL Query:", sqlQuery);
      const results = await db.query(sqlQuery);
      scholarships = results.rows;
    } else {
      scholarships = await models.Scholarship.findAll({
        order: [
          ["deadline", "ASC"],
          ["amount", "DESC"],
        ],
      });
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
      return res.status(404).json({ message: RESPONSE_SCHOLARSHIP_NOT_FOUND });
    }

    const alreadyApplied = await models.Application.findOne({
      where: { userId: user_id, scholarshipId: scholarship_id },
    });

    if (alreadyApplied) {
      return res.status(400).json({
        message: RESPONSE_ALREADY_APPLIED,
      });
    }

    const newApplication = await models.Application.create({
      userId: user_id,
      scholarshipId: scholarship_id,
      status: "pending",
    });

    res.status(201).json({
      data: newApplication,
      message: RESPONSE_SUCCESS_APPLY_SCHOLARSHIP,
    });
  } catch (error) {
    console.error("Error applying for scholarship:", error);
    res.status(500).json({ message: RESPONSE_INTERNAL_SERVER_ERROR });
  }
});

const overallInformation = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalApplications, approvedApplications, pendingApplications] =
      await Promise.all([
        models.Application.count({ where: { userId } }),
        models.Application.count({ where: { userId, status: "approved" } }),
        models.Application.count({ where: { userId, status: "pending" } }),
      ]);

    res.status(200).json({
      message: RESPONSE_SUCCESS_APPLICATION_STATS,
      data: {
        totalApplications,
        approvedApplications,
        pendingApplications,
      },
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    res.status(500).json({ message: RESPONSE_INTERNAL_SERVER_ERROR });
  }
});

const getAllAppliedScholarships = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await models.Application.findAll({
      where: { userId },
      include: [
        {
          model: models.Scholarship,
          as: "Scholarship",
          attributes: ["id", "name", "amount"],
        },
      ],
    });

    if (!applications.length) {
      return res.status(404).json({
        message: RESPONSE_NO_SCHOLARSHIPS_APPLIED,
        data: [],
      });
    }

    res.status(200).json({
      message: RESPONSE_SUCCESS_RETRIEVE_APPLIED,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applied scholarships:", error);
    res.status(500).json({ message: RESPONSE_INTERNAL_SERVER_ERROR });
  }
});

const getPersonalizedScholarships = asyncHandler(async (req, res) => {
  try {
    const { email } = req.user;

    const userProfile = await models.User.findOne({
      where: { email },
    });

    const whereClause = {};
    const filterableFields = ["location", "category", "religious", "gender"];

    filterableFields.forEach((field) => {
      const value = userProfile[field];
      if (value && value !== "Any") {
        whereClause[field] = {
          [Op.iLike]: `%${value}%`,
        };
      }
    });

    if (Object.keys(whereClause).length === 0) {
      return res.status(400).json({
        message: RESPONSE_COMPLETE_PROFILE,
        data: [],
      });
    }

    const scholarships = await models.Scholarship.findAll({
      where: whereClause,
      attributes: ["id", "name", "deadline", "amount", "category"],
    });

    res.status(200).json({
      message: RESPONSE_SUCCESS_PERSONALIZED,
      data: scholarships,
    });
  } catch (error) {
    console.error("Error fetching personalized scholarships:", error);
    res.status(500).json({ message: RESPONSE_INTERNAL_SERVER_ERROR });
  }
});

export {
  getAllScholarships,
  applyScholarship,
  overallInformation,
  getAllAppliedScholarships,
  getPersonalizedScholarships,
};
