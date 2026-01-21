const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vegetable = sequelize.define('Vegetable', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: 'Name cannot exceed 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('Leafy Greens', 'Root Vegetables', 'Exotic', 'Herbs', 'Mushrooms', 'Microgreens', 'Other'),
    defaultValue: 'Exotic'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Quantity cannot be negative'
      }
    }
  },
  unit: {
    type: DataTypes.ENUM('kg', 'g', 'pieces', 'bunches', 'boxes'),
    defaultValue: 'kg'
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Rate cannot be negative'
      }
    }
  },
  minOrderQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
    field: 'min_order_quantity'
  },
  mainImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'main_image'
  },
  additionalImages: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'additional_images'
  },
  traderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'trader_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  traderName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'trader_name'
  },
  origin: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  isOrganic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_organic'
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available'
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  nutritionalInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'nutritional_info'
  }
}, {
  tableName: 'vegetables',
  indexes: [
    { fields: ['category'] },
    { fields: ['trader_id'] },
    { fields: ['is_available'] },
    { fields: ['rate'] }
  ]
});

module.exports = Vegetable;
