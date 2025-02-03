const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class User extends Model {}

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      caste: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      religion: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      academicDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,

    }
  );

  return User;
};

