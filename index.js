const app = require("./app.js");
require("dotenv").config();
const db = require("./src/database/db.js");
const { sequelize } = require("./src/schema");

const port = process.env.PORT || 5400;

const initializeApp = async () => {
  try {
    console.log("Checking database connection...");
    await db.query("SELECT NOW()");
    console.log("Database connected successfully!");
    // createDB()
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    process.exit(1);
  }
};

initializeApp();

function createDB() {
  sequelize.sync({ force: true }).then(() => {
    console.log("Database synced!");
  });
}
