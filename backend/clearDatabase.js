require("dotenv").config();
const { sequelize } = require("./src/config/database");
const {
  User,
  Vegetable,
  Order,
  OrderItem,
  SpecialOrder,
  TraderQuote,
  Review,
  Notification,
  SavedTrader,
} = require("./src/models");

const clearDatabase = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    console.log("\n⚠️  WARNING: This will DELETE ALL DATA from the database!");
    console.log("⚠️  Tables to be cleared:");
    console.log("   - Users");
    console.log("   - Vegetables");
    console.log("   - Orders");
    console.log("   - Order Items");
    console.log("   - Special Orders");
    console.log("   - Trader Quotes");
    console.log("   - Reviews");
    console.log("   - Notifications");
    console.log("   - Saved Traders");
    console.log("");

    // Drop all tables in correct order (respecting foreign key constraints)
    console.log("🗑️  Dropping tables...");
    
    await SavedTrader.destroy({ where: {} });
    console.log("   ✓ Cleared SavedTraders");
    
    await Notification.destroy({ where: {} });
    console.log("   ✓ Cleared Notifications");
    
    await Review.destroy({ where: {} });
    console.log("   ✓ Cleared Reviews");
    
    await TraderQuote.destroy({ where: {} });
    console.log("   ✓ Cleared TraderQuotes");
    
    await OrderItem.destroy({ where: {} });
    console.log("   ✓ Cleared OrderItems");
    
    await Order.destroy({ where: {} });
    console.log("   ✓ Cleared Orders");
    
    await SpecialOrder.destroy({ where: {} });
    console.log("   ✓ Cleared SpecialOrders");
    
    await Vegetable.destroy({ where: {} });
    console.log("   ✓ Cleared Vegetables");
    
    await User.destroy({ where: {} });
    console.log("   ✓ Cleared Users");

    console.log("\n✅ Database cleared successfully!");
    console.log("📊 All tables are now empty.");
    
  } catch (error) {
    console.error("\n❌ Error clearing database:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
    process.exit(0);
  }
};

// Run the script
clearDatabase();
