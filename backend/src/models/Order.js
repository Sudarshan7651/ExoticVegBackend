const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      field: "order_number",
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
    customerPhone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: "customer_phone",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "total_amount",
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    finalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "final_amount",
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ),
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      defaultValue: "pending",
      field: "payment_status",
    },
    paymentMethod: {
      type: DataTypes.ENUM("cod", "upi", "card", "netbanking"),
      defaultValue: "cod",
      field: "payment_method",
    },
    deliveryStreet: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "delivery_street",
    },
    deliveryCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "delivery_city",
    },
    deliveryState: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "delivery_state",
    },
    deliveryPincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "delivery_pincode",
    },
    deliveryLandmark: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "delivery_landmark",
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "delivery_date",
    },
    deliverySlot: {
      type: DataTypes.ENUM("morning", "afternoon", "evening"),
      allowNull: true,
      field: "delivery_slot",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: "status_history",
    },
  },
  {
    tableName: "orders",
    indexes: [
      { fields: ["order_number"] },
      { fields: ["customer_id"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
    ],
    hooks: {
      beforeValidate: (order) => {
        // Generate order number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        order.orderNumber = `EV${year}${month}${day}${random}`;
      },
    },
  },
);

module.exports = Order;
