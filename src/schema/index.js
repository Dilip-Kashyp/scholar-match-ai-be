// models/index.js
const { Sequelize } = require("sequelize");
const User = require("./userSchema");
const Scholarship = require("./scholershipSchema");
const Application = require("./Application");


const sequelize = new Sequelize("postgres", "postgres", "New_password", {
  host: "localhost",
  dialect: "postgres",
});

const models = {
  User: User(sequelize),
  Scholarship: Scholarship(sequelize),
  Application: Application(sequelize),
};



models.User.hasMany(models.Application, { foreignKey: "userId" });
models.Application.belongsTo(models.User, { foreignKey: "userId" });

models.Scholarship.hasMany(models.Application, { foreignKey: "scholarshipId" });
models.Application.belongsTo(models.Scholarship, { foreignKey: "scholarshipId" });

module.exports = { sequelize, ...models };
