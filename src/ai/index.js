// main.js
import { Sequelize } from "sequelize";
import { models } from "../schema/index.js";
import { embedContent } from "../utils/googleGemini.js";
import {
  initPinecone,
  queryPinecone,
  upsertToPinecone,
} from "../utils/pineCone.js";
import dotenv from "dotenv";
import extractSearchParameters from "../utils/genAI.js";
import {
  DATABASE_CONNECTION_SUCCESS,
  DATABASE_CONNECTION_ERROR,
  NO_SCHOLARSHIPS_FOUND,
  SEARCH_QUERY_ERROR,
} from "../constants/aiConstants.js";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      keepAlive: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
  }
);

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log(DATABASE_CONNECTION_SUCCESS);
      return true;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(DATABASE_CONNECTION_ERROR);
};

connectWithRetry().catch((err) => {
  console.error("Final connection error:", err);
  process.exit(1);
});

async function initializeData() {
  const index = await initPinecone();

  try {
    const scholarships = await models.Scholarship.findAll();
    const vectors = await Promise.all(
      scholarships.map(async (scholarship) => {
        const scholarshipText = `
          Name: ${scholarship.name}
          Description: ${scholarship.description}
          Type: ${scholarship.type}
          Category: ${scholarship.category}
          Religious: ${scholarship.religious}
          Gender: ${scholarship.gender}
          Location: ${scholarship.location}
        `;

        const embedding = await embedContent(scholarshipText);

        return {
          id: scholarship.id.toString(),
          values: embedding,
          metadata: {
            id: scholarship.id.toString(),
            name: scholarship.name,
            category: scholarship.category,
            type: scholarship.type,
          },
        };
      })
    );

    if (vectors.length > 0) {
      await upsertToPinecone(index, vectors);
    } else {
      console.log(NO_SCHOLARSHIPS_FOUND);
    }
  } catch (error) {
    console.error("Error in initializeData:", error);
    throw error;
  }
}

async function findScholarshipsByQuery(query) {
  try {
    const totalCount = await models.Scholarship.count();

    if (totalCount === 0) {
      console.warn(NO_SCHOLARSHIPS_FOUND);
      return [];
    }

    if (!query || typeof query !== "string") {
      throw new Error(SEARCH_QUERY_ERROR);
    }

    const index = await initPinecone();
    const queryEmbedding = await embedContent(query);
    const vectorResults = await queryPinecone(index, queryEmbedding);

    const searchParams = await extractSearchParameters(query);
    const whereClause = {
      [Sequelize.Op.and]: [],
    };

    if (vectorResults?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        id: vectorResults.map((result) => result.id),
      });
    }

    if (searchParams.location?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          ...searchParams.location.map(loc => ({
            location: { [Sequelize.Op.iLike]: `%${loc}%` }
          })),
          { location: { [Sequelize.Op.iLike]: '%Any%' } },
          { location: { [Sequelize.Op.iLike]: '%India%' } }
        ]
      });
    }

    if (searchParams.category?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          ...searchParams.category.map(cat => ({
            category: { [Sequelize.Op.iLike]: `%${cat}%` }
          })),
          { category: { [Sequelize.Op.iLike]: '%Any%' } }
        ]
      });
    }

    if (searchParams.gender?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          { gender: { [Sequelize.Op.in]: searchParams.gender } },
          { gender: "Any" }
        ]
      });
    }

    if (searchParams.religious?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          { religious: { [Sequelize.Op.in]: searchParams.religious } },
          { religious: "Any" }
        ]
      });
    }

    if (searchParams.keywords?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: searchParams.keywords.map((keyword) => ({
          [Sequelize.Op.or]: [
            { name: { [Sequelize.Op.iLike]: `%${keyword}%` } },
            { description: { [Sequelize.Op.iLike]: `%${keyword}%` } },
            { type: { [Sequelize.Op.iLike]: `%${keyword}%` } },
          ],
        })),
      });
    }

    if (whereClause[Sequelize.Op.and].length === 0) {
      delete whereClause[Sequelize.Op.and];
    }

    const scholarships = await models.Scholarship.findAll({
      where: whereClause,
      raw: true,
      limit: 100,
      order: [["createdAt", "DESC"]],
    });
    return scholarships;
  } catch (error) {
    console.error("Error in findScholarshipsByQuery:", error);
    throw error;
  }
}

async function runSearch(query) {
  try {
    const scholarships = await findScholarshipsByQuery(query);
    return scholarships;
  } catch (error) {
    console.error("Error in search:", error);
    throw error;
  }
}

export { runSearch };
