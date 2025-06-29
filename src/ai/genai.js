import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateSQLQuery(userQuery) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
Convert this natural language query into a PostgreSQL SELECT query for scholarships: "${userQuery}"

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
1. ALWAYS include is_active = true in WHERE clause
2. For text fields (name, description, type, etc.), use ILIKE with flexible matching patterns ('%term%')
3. For caste categories (SC, ST, OBC, BC, etc.), focus on matching in category field primarily
4. Age requirements should check if user's age is within min_age and max_age range
5. For gender filters, check if gender = specific_gender OR gender = 'Any'
6. For religious filters, check if religious = specific_religion OR religious = 'Any'
7. Handle NULL values appropriately for optional fields
8. For deadline, check if it's NULL or in the future
9. IMPORTANT: Don't dilute specific category searches with general keywords
10. Order results by deadline ASC NULLS LAST, amount DESC
11. Limit results to 100
12. Return ONLY the raw SQL query text, NO markdown formatting, NO backticks, NO sql tags, NO comments or explanations

Special handling:
- For education searches (BCA, BTech, etc.), check both type and description fields
- For SC/ST/OBC/BC searches, focus primarily on the category field, not general search
- For location searches, match against the location field only
- Ensure queries with multiple criteria (like "SC student in Delhi") filter correctly on ALL criteria

IMPORTANT: Return only the plain text SQL query without any code formatting markers like \`\`\` or \`\`\`sql.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let sqlQuery = response.text().trim();
    sqlQuery = sqlQuery
      .replace(/```sql/g, "")
      .replace(/```/g, "")
      .trim();

    if (
      !sqlQuery.includes("SELECT") ||
      !sqlQuery.includes("FROM scholarships") ||
      !sqlQuery.includes("is_active = true")
    ) {
      throw new Error("Generated query doesn't meet requirements");
    }

    return sqlQuery;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    return fallbackGenerateQuery(userQuery);
  }
}

function fallbackGenerateQuery(userQuery) {
  let baseQuery = `SELECT * FROM scholarships WHERE is_active = true`;
  const conditions = [];
  const query = userQuery.toLowerCase();

  if (query.includes("sc") || query.includes("scheduled caste")) {
    conditions.push(
      `(category ILIKE '%sc%' OR category ILIKE '%scheduled caste%' OR category = 'Any')`
    );
  } else if (query.includes("st") || query.includes("scheduled tribe")) {
    conditions.push(
      `(category ILIKE '%st%' OR category ILIKE '%scheduled tribe%' OR category = 'Any')`
    );
  } else if (query.includes("obc") || query.includes("other backward class")) {
    conditions.push(
      `(category ILIKE '%obc%' OR category ILIKE '%other backward class%' OR category = 'Any')`
    );
  } else if (query.includes("bc") || query.includes("backward class")) {
    conditions.push(
      `(category ILIKE '%bc%' OR category ILIKE '%backward class%' OR category = 'Any')`
    );
  } else if (query.includes("general")) {
    conditions.push(`(category ILIKE '%general%' OR category = 'Any')`);
  }

  const locations = [
    "delhi",
    "mumbai",
    "bangalore",
    "kolkata",
    "chennai",
    "hyderabad",
    "pune",
    "ahmedabad",
    "jaipur",
    "india",
  ];
  for (const loc of locations) {
    if (query.includes(loc)) {
      conditions.push(`location ILIKE '%${loc}%'`);
      break;
    }
  }
  if (
    query.includes("female") ||
    query.includes("women") ||
    query.includes("woman") ||
    query.includes("girl") ||
    query.includes("girls")
  ) {
    conditions.push(`(gender = 'Female' OR gender = 'Any')`);
  } else if (
    query.includes("male") ||
    query.includes("men") ||
    query.includes("man") ||
    query.includes("boy") ||
    query.includes("boys")
  ) {
    conditions.push(`(gender = 'Male' OR gender = 'Any')`);
  }

  const educationTypes = [
    "bca",
    "btech",
    "mca",
    "undergraduate",
    "graduate",
    "postgraduate",
  ];
  for (const type of educationTypes) {
    if (query.includes(type)) {
      conditions.push(
        `(type ILIKE '%${type}%' OR description ILIKE '%${type}%')`
      );
      break;
    }
  }
  if (query.includes("disability") || query.includes("disabled")) {
    conditions.push(`disability = true`);
  }

  if (query.includes("ex-service") || query.includes("veteran")) {
    conditions.push(`ex_service = true`);
  }

  if (conditions.length > 0) {
    baseQuery += ` AND ${conditions.join(" AND ")}`;
  }

  return baseQuery + ` ORDER BY deadline ASC NULLS LAST, amount DESC LIMIT 100`;
}

export { generateSQLQuery };
