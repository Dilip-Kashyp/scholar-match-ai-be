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
      "category": "",
      "location": "",
      "gender": "",
      "religious": "",
      "keywords": []
    }

    Rules:
    - category must be one of: "ST", "SC", "OBC", "GENERAL", or empty string
    - location should be a city name or empty string
    - gender should be "male", "female", or empty string
    - religious should be "hindu", "muslim", "christian", "sikh", or empty string
    - keywords should be an array of relevant search terms
    - Only include values that are clearly mentioned in the query
    - Do not add any markdown formatting or extra text
    - Return ONLY the JSON object`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean the response to ensure it's valid JSON
    const cleanedText = text
      .replace(/^```json\s*/, '')  // Remove leading ```json
      .replace(/```$/, '')         // Remove trailing ```
      .trim();
    
    try {
      const parsed = JSON.parse(cleanedText);
      console.log("Extracted parameters:", parsed);
      return parsed;
    } catch (parseError) {
      console.error("JSON Parse Error. Response was:", cleanedText);
      // Return default structure if parsing fails
      return {
        category: "",
        location: "",
        gender: "",
        religious: "",
        keywords: []
      };
    }
  } catch (error) {
    console.error("Error in extractSearchParameters:", error);
    // Return default structure on error
    return {
      category: "",
      location: "",
      gender: "",
      religious: "",
      keywords: []
    };
  }
}

export default extractSearchParameters;
