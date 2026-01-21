const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SpecialOrder = sequelize.define(
  "SpecialOrder",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requestNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      field: "request_number",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "customer_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "customer_name",
    },
    vegetableName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "vegetable_name",
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Quantity must be at least 1",
        },
      },
    },
    unit: {
      type: DataTypes.ENUM("kg", "g", "pieces", "bunches", "boxes"),
      defaultValue: "kg",
    },
    requiredBy: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "required_by",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "open",
        "quoted",
        "accepted",
        "fulfilled",
        "closed",
        "cancelled",
      ),
      defaultValue: "open",
    },
    acceptedQuoteId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "accepted_quote_id",
    },
    budgetMin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "budget_min",
    },
    budgetMax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "budget_max",
    },
    deliveryLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "delivery_location",
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "delivery_address",
    },
  },
  {
    tableName: "special_orders",
    indexes: [
      { fields: ["request_number"] },
      { fields: ["customer_id"] },
      { fields: ["status"] },
      { fields: ["required_by"] },
    ],
    hooks: {
      beforeValidate: (order) => {
        // Generate request number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        order.requestNumber = `SR${year}${month}${random}`;
      },
    },
  },
);

module.exports = SpecialOrder;
