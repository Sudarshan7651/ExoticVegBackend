const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "buyer_id",
    },
    traderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "trader_id",
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "order_id",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "reviews",
    timestamps: true,
  },
);

module.exports = Review;
