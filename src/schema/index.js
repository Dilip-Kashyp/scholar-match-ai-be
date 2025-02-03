// models/index.js
const { Sequelize } = require("sequelize");
const User = require("./userSchema");
const Scholarship = require("./scholershipSchema");
const Application = require("./Application");


const sequelize = new Sequelize("scholarship_db", "scholarship_db", "knLDAs5Pm8OwTW7jg4wr0i2zFmteLWJA", {
  host: "dpg-cuga60l6l47c73a0heug-a.oregon-postgres.render.com",
  dialect: "postgres",
  ssl: true,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false
    }
  }

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
