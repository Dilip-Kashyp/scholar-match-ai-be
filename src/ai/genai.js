import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateSQLQuery(userQuery) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Convert this natural language query into a PostgreSQL SELECT query for scholarships: "${userQuery}"

    Use this exact table schema:
    CREATE TABLE scholarships (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      location VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      religious VARCHAR(255) NOT NULL,
      gender VARCHAR(255) NOT NULL,
      min_age INTEGER NOT NULL,
      max_age INTEGER NOT NULL,
      category VARCHAR(255) NOT NULL,
      institution_name VARCHAR(255),
      deadline DATE,
      income INTEGER,
      disability BOOLEAN,
      ex_service BOOLEAN,
      is_active BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP,
      "updatedAt" TIMESTAMP
    );

    Rules for query generation:
    1. Always include is_active = true in WHERE clause
    2. Use ILIKE for text pattern matching
    3. Use proper NULL handling
    4. Include proper date handling for deadlines
    5. Use BETWEEN for age and amount ranges
    6. Consider 'Any' as a valid match for gender, religious, and category
    7. Order results by deadline ASC, amount DESC
    8. Limit results to 100
    9. Return ONLY the SQL query, no explanations

    Example format:
    SELECT * FROM scholarships 
    WHERE is_active = true 
    AND (location ILIKE '%delhi%' OR location = 'Any')
    ORDER BY deadline ASC, amount DESC 
    LIMIT 100;`;

    const result = await model.generateContent(prompt);
    let sqlQuery = result.response.text().trim();
    
    // Clean up the response
    sqlQuery = sqlQuery
      .replace(/```sql\s*/g, '')
      .replace(/```/g, '')
      .trim();

    // Validate query has basic required elements
    if (!sqlQuery.includes('SELECT') || !sqlQuery.includes('FROM scholarships')) {
      throw new Error('Invalid SQL query generated');
    }

    // Ensure is_active = true is included
    if (!sqlQuery.includes('is_active = true')) {
      sqlQuery = sqlQuery.replace(
        /WHERE/i,
        'WHERE is_active = true AND'
      );
    }

    return sqlQuery;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    // Return a safe default query
    return `
      SELECT * FROM scholarships 
      WHERE is_active = true 
      ORDER BY deadline ASC, amount DESC 
      LIMIT 100;
    `.trim();
  }
}

// Example usage:
async function searchScholarships(userQuery) {
  try {
    const sqlQuery = await generateSQLQuery(userQuery);
    console.log('Generated SQL Query:', sqlQuery);
    return sqlQuery;
  } catch (error) {
    console.error('Error in searchScholarships:', error);
    throw error;
  }
}

export { generateSQLQuery, searchScholarships }; 