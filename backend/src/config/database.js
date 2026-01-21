const { Sequelize } = require("sequelize");

// SSL configuration for cloud databases (Aiven)
const sslConfig =
  process.env.DB_SSL === "true"
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Required for Aiven's self-signed certificates
          },
        },
      }
    : {};

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || "exoticveg360",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 20, // Matching Aiven's connection limit
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true, // Use snake_case for columns
    },
    ...sslConfig,
  },
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected Successfully");

    // Sync all models (in development, use { alter: true } for auto-migration)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("✅ Database synchronized");
    }
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn(
        "⚠️ Running without database connection in development mode",
      );
    }
  }
};

module.exports = { sequelize, connectDB };
