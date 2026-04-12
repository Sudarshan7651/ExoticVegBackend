require("dotenv").config();
const { sequelize } = require("../src/config/database");

const migrateSeparatePaymentStatuses = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    console.log("\n📝 Migrating payment status fields...");

    // Check if buyer_payment_status column exists
    const tableDescription = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'special_orders' AND column_name = 'buyer_payment_status'`
    );

    if (tableDescription[0].length === 0) {
      // Add buyer_payment_status column
      await sequelize.query(`
        ALTER TABLE special_orders 
        ADD COLUMN buyer_payment_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (buyer_payment_status IN ('pending', 'paid'))
      `);
      console.log("   ✓ Added buyer_payment_status column");
    } else {
      console.log("   ✓ buyer_payment_status column already exists");
    }

    // Check if trader_payment_status column exists
    const traderColumnCheck = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'special_orders' AND column_name = 'trader_payment_status'`
    );

    if (traderColumnCheck[0].length === 0) {
      // Check if old payment_status column exists
      const oldColumnCheck = await sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'special_orders' AND column_name = 'payment_status'`
      );

      if (oldColumnCheck[0].length > 0) {
        // Rename payment_status to trader_payment_status
        await sequelize.query(`
          ALTER TABLE special_orders 
          RENAME COLUMN payment_status TO trader_payment_status
        `);
        console.log("   ✓ Renamed payment_status to trader_payment_status");
      } else {
        // Add trader_payment_status column if old column doesn't exist
        await sequelize.query(`
          ALTER TABLE special_orders 
          ADD COLUMN trader_payment_status VARCHAR(20) DEFAULT 'pending' 
          CHECK (trader_payment_status IN ('pending', 'received'))
        `);
        console.log("   ✓ Added trader_payment_status column");
      }
    } else {
      console.log("   ✓ trader_payment_status column already exists");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("📊 Database schema updated with separate payment statuses");
    
  } catch (error) {
    console.error("\n❌ Migration error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
    process.exit(0);
  }
};

// Run the migration
migrateSeparatePaymentStatuses();
