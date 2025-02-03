const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Application extends Model {}

  Application.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      scholarshipId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "scholarships",
          key: "id",
        },
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: "Pending",
      },
    },
    {
      sequelize,
      modelName: "Application",
      tableName: "applications",
      timestamps: true,
    }
  );

  return Application;
};
