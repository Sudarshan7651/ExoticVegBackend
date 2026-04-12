const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RefundRequest = sequelize.define('RefundRequest', {
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
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  processedAt: {
    type: DataTypes.DATE,
  },
  processedBy: {
    type: DataTypes.UUID,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
});

module.exports = RefundRequest;
