const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TraderQuote = sequelize.define(
  "TraderQuote",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    specialOrderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "special_order_id",
      references: {
        model: "special_orders",
        key: "id",
      },
    },
    traderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "trader_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    traderName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "trader_name",
    },
    quotedPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "quoted_price",
    },
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "price_per_unit",
    },
    estimatedDelivery: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "estimated_delivery",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "trader_quotes",
    indexes: [
      { fields: ["special_order_id"] },
      { fields: ["trader_id"] },
      { fields: ["status"] },
    ],
  },
);

module.exports = TraderQuote;
