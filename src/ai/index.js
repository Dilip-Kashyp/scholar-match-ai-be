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

dotenv.config();

// Initialize Sequelize with proper SSL and retry configuration
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "postgres",
  port: process.env.DB_PORT,
  logging: false, // Disable logging
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    keepAlive: true,
  },
  pool: {
    max: 5, // Maximum number of connection in pool
    min: 0, // Minimum number of connection in pool
    acquire: 60000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000, // The maximum time, in milliseconds, that a connection can be idle before being released
  },
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/,
      /ECONNRESET/,
    ],
    max: 3 // Maximum amount of tries
  }
});

// Add connection verification with retries
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      return true;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to database after multiple attempts');
};

// Initialize connection
connectWithRetry().catch(err => {
  console.error('Final connection error:', err);
  process.exit(1); // Exit if we can't connect to database
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
      console.log("No scholarships found to index");
    }
  } catch (error) {
    console.error("Error in initializeData:", error);
    throw error;
  }
}

async function findScholarshipsByQuery(query) {
  try {
    // Verify database has data
    const totalCount = await models.Scholarship.count();
    console.log('Total scholarships in database:', totalCount);

    if (totalCount === 0) {
      console.warn('No scholarships found in database!');
      return [];
    }

    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query parameter');
    }

    const index = await initPinecone();
    const queryEmbedding = await embedContent(query);
    const vectorResults = await queryPinecone(index, queryEmbedding);
    
    const searchParams = await extractSearchParameters(query);
    console.log('Search query:', query);
    
    // Build where clause with AND and OR conditions for better accuracy
    const whereClause = {
      [Sequelize.Op.and]: [] // Use AND for combining different conditions
    };

    // Add vector search results if available
    if (vectorResults?.length > 0) {
      whereClause[Sequelize.Op.and].push({
        id: vectorResults.map(result => result.id)
      });
    }

    // Create location filter
    if (searchParams.location) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          { location: { [Sequelize.Op.iLike]: `%${searchParams.location}%` } },
          { location: 'Any' }, 
          { location: 'All India' }
        ]
      });
    }

    // Add category condition if found
    if (searchParams.category) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          { category: searchParams.category },
          { category: 'Any' }, // Include scholarships for all categories
          { category: 'General' } // Include general category when specific category is searched
        ]
      });
    }

    // Add gender condition if found
    if (searchParams.gender) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          { gender: { [Sequelize.Op.iLike]: `%${searchParams.gender}%` } },
          { gender: 'Any' } // Include gender-neutral scholarships
        ]
      });
    }

    // Add religious condition if found
    if (searchParams.religious) {
      whereClause[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [
          { religious: { [Sequelize.Op.iLike]: `%${searchParams.religious}%` } },
          { religious: 'Any' } // Include religion-neutral scholarships
        ]
      });
    }

    // Add keyword-based search if keywords exist
    if (searchParams.keywords?.length > 0) {
      const keywordConditions = {
        [Sequelize.Op.or]: searchParams.keywords.map(keyword => ({
          [Sequelize.Op.or]: [
            { name: { [Sequelize.Op.iLike]: `%${keyword}%` } },
            { description: { [Sequelize.Op.iLike]: `%${keyword}%` } },
            { type: { [Sequelize.Op.iLike]: `%${keyword}%` } }
          ]
        }))
      };
      whereClause[Sequelize.Op.and].push(keywordConditions);
    }

    // If no conditions were added, remove the AND clause
    if (whereClause[Sequelize.Op.and].length === 0) {
      delete whereClause[Sequelize.Op.and];
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    // Get scholarships with dynamic filters
    const scholarships = await models.Scholarship.findAll({
      where: whereClause,
      raw: true,
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    console.log('Found scholarships:', scholarships.length);
    return scholarships;
  } catch (error) {
    console.error("Error in findScholarshipsByQuery:", error);
    throw error;
  }
}

async function runSearch(query) {
  try {
    // Remove initializeData() call from here
    const scholarships = await findScholarshipsByQuery(query);
    return scholarships;
  } catch (error) {
    console.error("Error in search:", error);
    throw error; // Add this to propagate the error
  }
}

export { runSearch };
