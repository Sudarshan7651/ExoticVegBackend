const { sequelize } = require("../config/database");

// Import models
const User = require("./User");
const Vegetable = require("./Vegetable");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const SpecialOrder = require("./SpecialOrder");
const TraderQuote = require("./TraderQuote");
const Review = require("./Review");
const Notification = require("./Notification");
const SavedTrader = require("./SavedTrader");
const RefundRequest = require("./RefundRequest");
const OrderModification = require("./OrderModification");

// Define associations

// User associations
User.hasMany(Vegetable, { foreignKey: "traderId", as: "vegetables" });
User.hasMany(Order, { foreignKey: "customerId", as: "orders" });
User.hasMany(SpecialOrder, { foreignKey: "customerId", as: "specialOrders" });
User.hasMany(TraderQuote, { foreignKey: "traderId", as: "quotes" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });

// Vegetable associations
Vegetable.belongsTo(User, { foreignKey: "traderId", as: "trader" });
Vegetable.hasMany(OrderItem, { foreignKey: "vegetableId", as: "orderItems" });

// Order associations
Order.belongsTo(User, { foreignKey: "customerId", as: "customer" });
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });
OrderItem.belongsTo(Vegetable, { foreignKey: "vegetableId", as: "vegetable" });
OrderItem.belongsTo(User, { foreignKey: "traderId", as: "trader" });

// SpecialOrder associations
SpecialOrder.belongsTo(User, { foreignKey: "customerId", as: "customer" });
SpecialOrder.hasMany(TraderQuote, {
  foreignKey: "specialOrderId",
  as: "quotes",
});

// TraderQuote associations
TraderQuote.belongsTo(SpecialOrder, {
  foreignKey: "specialOrderId",
  as: "specialOrder",
});
TraderQuote.belongsTo(User, { foreignKey: "traderId", as: "trader" });

// Review associations
Review.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
Review.belongsTo(User, { foreignKey: "traderId", as: "trader" });
Review.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// Notification associations
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Review, { foreignKey: "traderId", as: "receivedReviews" });
User.hasMany(SavedTrader, { foreignKey: "buyerId", as: "savedTraders" });
User.hasMany(SavedTrader, { foreignKey: "traderId", as: "savedByBuyers" });
SavedTrader.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
SavedTrader.belongsTo(User, { foreignKey: "traderId", as: "trader" });

module.exports = {
  sequelize,
  User,
  Vegetable,
  Order,
  OrderItem,
  SpecialOrder,
  TraderQuote,
  Review,
  Notification,
  SavedTrader,
  RefundRequest,
  OrderModification,
};
