const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  vegetableId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'vegetable_id',
    references: {
      model: 'vegetables',
      key: 'id'
    }
  },
  vegetableName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'vegetable_name'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  traderId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'trader_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'order_items',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['vegetable_id'] },
    { fields: ['trader_id'] }
  ]
});

module.exports = OrderItem;
