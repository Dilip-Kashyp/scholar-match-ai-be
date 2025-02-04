import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function extractSearchParameters(query) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this scholarship search query: "${query}"
    Extract relevant parameters and return them in this exact format:
    {
      "category": [],
      "location": [],
      "gender": [],
      "religious": [],
      "keywords": []
    }

    Rules:
    - category must be an array containing any of: "ST", "SC", "OBC", "GENERAL" (in uppercase)
    - If multiple categories are mentioned (like "SC and ST"), include all of them in the array
    - location should be an array of city names (in Title Case)
    - gender should be an array containing "Male", "Female", or empty array (in Title Case)
    - religious should be an array containing "Hindu", "Muslim", "Christian", "Sikh", or empty array (in Title Case)
    - keywords should be an array of relevant search terms (in lowercase)
    - If multiple values are mentioned for any field (like "Delhi and Haryana"), include all of them
    - Only include values that are clearly mentioned in the query
    - Do not add any markdown formatting or extra text
    - Return ONLY the JSON object`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    const cleanedText = text
      .replace(/^```json\s*/, '')  
      .replace(/```$/, '')        
      .trim();
    
    try {
      const parsed = JSON.parse(cleanedText);
      
      // Ensure all fields are arrays and normalize case
      const ensureArray = (value) => {
        if (typeof value === 'string' && value) {
          return [value];
        }
        return Array.isArray(value) ? value : [];
      };

      // Normalize case for each field
      return {
        category: ensureArray(parsed.category).map(cat => cat.toUpperCase()),
        location: ensureArray(parsed.location).map(loc => loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase()),
        gender: ensureArray(parsed.gender).map(gen => gen.charAt(0).toUpperCase() + gen.slice(1).toLowerCase()),
        religious: ensureArray(parsed.religious).map(rel => rel.charAt(0).toUpperCase() + rel.slice(1).toLowerCase()),
        keywords: ensureArray(parsed.keywords).map(kw => kw.toLowerCase())
      };
    } catch (parseError) {
      console.error("JSON Parse Error. Response was:", cleanedText);
      return {
        category: [],
        location: [],
        gender: [],
        religious: [],
        keywords: []
      };
    }
  } catch (error) {
    console.error("Error in extractSearchParameters:", error);
    return {
      category: [],
      location: [],
      gender: [],
      religious: [],
      keywords: []
    };
  }
}

export default extractSearchParameters;
