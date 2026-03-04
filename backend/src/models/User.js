const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: "Name must be between 2 and 50 characters",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Please enter a valid email",
        },
      },
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      validate: {
        is: {
          args: /^[0-9]{10}$/,
          msg: "Please enter a valid 10-digit phone number",
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("buyer", "trader", "admin"),
      defaultValue: "buyer",
    },
    businessName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "business_name",
    },
    addressStreet: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "address_street",
    },
    addressCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "address_city",
    },
    addressState: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "address_state",
    },
    addressPincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "address_pincode",
    },
    gstNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "gst_number",
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "profile_image",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_verified",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    membershipTier: {
      type: DataTypes.ENUM("Bronze", "Silver", "Gold", "Platinum"),
      defaultValue: "Bronze",
      field: "membership_tier",
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_orders",
    },
    totalSpent: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: "total_spent",
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "rating",
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "rating_count",
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return safe JSON (without password)
User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
