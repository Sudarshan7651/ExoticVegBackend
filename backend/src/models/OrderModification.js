const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderModification = sequelize.define('OrderModification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id',
    },
  },
  requestedBy: {
    type: DataTypes.ENUM('buyer', 'trader'),
    allowNull: false,
  },
  modificationType: {
    type: DataTypes.ENUM('quantity', 'cancellation', 'delivery_time'),
    allowNull: false,
  },
  currentValue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  requestedValue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  respondedAt: {
    type: DataTypes.DATE,
  },
  responseReason: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
});

module.exports = OrderModification;
