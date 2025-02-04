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
      "type": [],
      "institution": [],
      "amount": {
        "min": null,
        "max": null
      },
      "income": {
        "min": null,
        "max": null
      },
      "age": {
        "min": null,
        "max": null
      },
      "disability": null,
      "ex_service": null,
      "keywords": []
    }

    Rules:
    - category: array containing ["ST", "SC", "OBC", "GENERAL"] (uppercase)
    - location: array of location names (Title Case)
    - gender: array containing ["Male", "Female"] (Title Case)
    - religious: array containing ["Hindu", "Muslim", "Christian", "Sikh"] (Title Case)
    - type: array of scholarship types (Title Case)
    - institution: array of institution names (Title Case)
    - amount: extract min and max scholarship amount if mentioned
    - income: extract min and max family income criteria if mentioned
    - age: extract min and max age criteria if mentioned
    - disability: boolean (true/false) if disability criteria mentioned
    - ex_service: boolean (true/false) if ex-servicemen criteria mentioned
    - keywords: array of relevant search terms (lowercase)
    - Only include values that are clearly mentioned in the query
    - Return ONLY the JSON object`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    const cleanedText = text
      .replace(/^```json\s*/, '')  
      .replace(/```$/, '')        
      .trim();
    
    try {
      const parsed = JSON.parse(cleanedText);
      
      const ensureArray = (value) => {
        if (typeof value === 'string' && value) {
          return [value];
        }
        return Array.isArray(value) ? value : [];
      };

      return {
        category: ensureArray(parsed.category).map(cat => cat.toUpperCase()),
        location: ensureArray(parsed.location).map(loc => loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase()),
        gender: ensureArray(parsed.gender).map(gen => gen.charAt(0).toUpperCase() + gen.slice(1).toLowerCase()),
        religious: ensureArray(parsed.religious).map(rel => rel.charAt(0).toUpperCase() + rel.slice(1).toLowerCase()),
        type: ensureArray(parsed.type).map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()),
        institution: ensureArray(parsed.institution).map(inst => inst.charAt(0).toUpperCase() + inst.slice(1).toLowerCase()),
        amount: {
          min: parsed.amount?.min || null,
          max: parsed.amount?.max || null
        },
        income: {
          min: parsed.income?.min || null,
          max: parsed.income?.max || null
        },
        age: {
          min: parsed.age?.min || null,
          max: parsed.age?.max || null
        },
        disability: parsed.disability || null,
        ex_service: parsed.ex_service || null,
        keywords: ensureArray(parsed.keywords).map(kw => kw.toLowerCase())
      };
    } catch (parseError) {
      console.error("JSON Parse Error. Response was:", cleanedText);
      return {
        category: [], location: [], gender: [], religious: [], type: [],
        institution: [], amount: { min: null, max: null },
        income: { min: null, max: null }, age: { min: null, max: null },
        disability: null, ex_service: null, keywords: []
      };
    }
  } catch (error) {
    console.error("Error in extractSearchParameters:", error);
    return {
      category: [], location: [], gender: [], religious: [], type: [],
      institution: [], amount: { min: null, max: null },
      income: { min: null, max: null }, age: { min: null, max: null },
      disability: null, ex_service: null, keywords: []
    };
  }
}

export default extractSearchParameters;
