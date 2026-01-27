const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SavedTrader = sequelize.define(
  "SavedTrader",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "buyer_id",
    },
    traderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "trader_id",
    },
  },
  {
    tableName: "saved_traders",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["buyer_id", "trader_id"],
      },
    ],
  },
);

module.exports = SavedTrader;
