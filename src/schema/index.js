// models/index.js
import { Sequelize } from "sequelize";
import { User } from "./userSchema.js";
import { Scholarship } from "./scholarshipSchema.js"; // Corrected typo from 'scholershipSchema'
import { Application } from "./application.js";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    ssl: true,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

const models = {
  User: User(sequelize),
  Scholarship: Scholarship(sequelize),
  Application: Application(sequelize),
};

// Set up associations (already done in your code)
models.User.hasMany(models.Application, { foreignKey: "userId" });
models.Application.belongsTo(models.User, { foreignKey: "userId" });

models.Scholarship.hasMany(models.Application, { foreignKey: "scholarshipId" });
models.Application.belongsTo(models.Scholarship, {
  foreignKey: "scholarshipId",
});

// Syncing models (creating tables)
const syncDatabase = async () => {
  try {
    // This will create tables if they don't exist or update if necessary
    await sequelize.sync({ force: false }); // Use 'force: true' if you want to drop tables first (use with caution)
    console.log("Database & tables created or updated successfully!");
  } catch (error) {
    console.error("Unable to sync database:", error);
  }
};

// syncDatabase();

export { sequelize, models };
