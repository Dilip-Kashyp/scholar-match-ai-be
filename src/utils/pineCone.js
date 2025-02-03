import { Pinecone } from "@pinecone-database/pinecone";

const createPineconeIndex = async (pinecone) => {
  try {
    await pinecone.createIndex({
      name: "scholarships",
      dimension: 768,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
    } else {
      console.error("Error creating index:", error);
      throw error;
    }
  }
};

const initPinecone = async () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY environment variable is not set");
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  await createPineconeIndex(pinecone);

  const index = pinecone.index("scholarships");
  return index;
};

const queryPinecone = async (index, queryEmbedding) => {
  try {
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    });

    return queryResponse.matches.map((match) => ({
      id: match.metadata.id,
      score: match.score,
    }));
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    throw error;
  }
};

const upsertToPinecone = async (index, vectors) => {
  try {
    const invalidVectors = vectors.filter((v) => {
      if (!v.values || !Array.isArray(v.values)) {
        return true;
      }
      const hasNonZero = v.values.some((val) => val !== 0);
      return !hasNonZero;
    });

    if (invalidVectors.length > 0) {
      console.error("Invalid vectors:", invalidVectors);
      throw new Error(`Invalid vectors found: ${invalidVectors
        .map((v) => v.id)
        .join(", ")}. 
        Each vector must be an array and contain at least one non-zero value.`);
    }

    await index.upsert(vectors);
  } catch (error) {
    console.error("Error upserting vectors:", error);
    throw error;
  }
};

export { initPinecone, queryPinecone, upsertToPinecone };
