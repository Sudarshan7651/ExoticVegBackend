const { Op } = require("sequelize");
const {
  sequelize,
  Order,
  OrderItem,
  Vegetable,
  User,
  Notification,
} = require("../models");
const socketIO = require("../utils/socket");
const { createNotification } = require("./notification.controller");

/**
 * @desc    Get all orders (filtered by user role)
 * @route   GET /api/orders
 * @access  Private
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Filter by role
    if (req.user.role === "buyer") {
      where.customerId = req.userId;
    }
    // For traders, we need to filter by order items - handled separately
    // Admin sees all orders

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    let queryOptions = {
      where,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "phone"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Vegetable,
              as: "vegetable",
              attributes: ["id", "name", "mainImage"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    };

    // For traders, filter orders containing their items
    if (req.user.role === "trader") {
      queryOptions.include[1].where = { traderId: req.userId };
      queryOptions.include[1].required = true;
    }

    const { count, rows: orders } = await Order.findAndCountAll(queryOptions);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Vegetable,
              as: "vegetable",
              attributes: ["id", "name", "mainImage"],
            },
            {
              model: User,
              as: "trader",
              attributes: ["id", "name", "businessName", "phone"],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check access
    if (req.user.role === "buyer" && order.customerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
    });
  }
};

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private/Buyer
 */
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      items,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      deliveryLandmark,
      deliveryDate,
      deliverySlot,
      paymentMethod,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must have at least one item",
      });
    }

    // Calculate totals and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const vegetable = await Vegetable.findByPk(item.vegetableId);

      if (!vegetable || !vegetable.isAvailable) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Vegetable ${item.vegetableId} is not available`,
        });
      }

      if (item.quantity < vegetable.minOrderQuantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for ${vegetable.name} is ${vegetable.minOrderQuantity}`,
        });
      }

      const amount = parseFloat(vegetable.rate) * item.quantity;
      totalAmount += amount;

      orderItems.push({
        vegetableId: vegetable.id,
        vegetableName: vegetable.name,
        quantity: item.quantity,
        unit: vegetable.unit,
        rate: vegetable.rate,
        amount,
        traderId: vegetable.traderId,
      });
    }

    // Create order
    const order = await Order.create(
      {
        customerId: req.userId,
        customerName: req.user.name,
        customerPhone: req.user.phone,
        totalAmount,
        finalAmount: totalAmount,
        deliveryStreet: deliveryStreet || req.user.addressStreet,
        deliveryCity: deliveryCity || req.user.addressCity,
        deliveryState: deliveryState || req.user.addressState,
        deliveryPincode: deliveryPincode || req.user.addressPincode,
        deliveryLandmark,
        deliveryDate,
        deliverySlot,
        paymentMethod,
        notes,
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order placed",
          },
        ],
      },
      { transaction },
    );

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          ...item,
        },
        { transaction },
      );
    }

    // Update user stats
    await User.increment(
      { totalOrders: 1, totalSpent: parseFloat(totalAmount) },
      { where: { id: req.userId }, transaction },
    );

    await transaction.commit();

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: { order: completeOrder },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Trader/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // Update status history
    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
    });

    order.status = status;
    order.statusHistory = statusHistory;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated",
      data: { order },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
    });
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check ownership
    if (req.user.role === "buyer" && order.customerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Can only cancel pending or confirmed orders
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order in current status",
      });
    }

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      note: req.body.reason || "Order cancelled by customer",
    });

    order.status = "cancelled";
    order.statusHistory = statusHistory;
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
    });
  }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/orders/stats
 * @access  Private
 */
const getOrderStats = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "buyer") {
      where.customerId = req.userId;
    }

    const orders = await Order.findAll({
      where,
      attributes: ["status", "finalAmount"],
    });

    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalAmount: 0,
    };

    orders.forEach((order) => {
      stats[order.status]++;
      if (order.status !== "cancelled") {
        stats.totalAmount += parseFloat(order.finalAmount);
      }
    });

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
    });
  }
};

/**
 * @desc    Create order from market (buy ready stock directly)
 * @route   POST /api/orders/market
 * @access  Private/Buyer
 */
const createMarketOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      vegetableId,
      quantity,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      deliveryLandmark,
      deliveryDate,
      deliverySlot,
      paymentMethod,
      notes,
    } = req.body;

    if (!vegetableId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Vegetable ID and quantity are required",
      });
    }

    // Find the vegetable
    const vegetable = await Vegetable.findByPk(vegetableId, {
      include: [
        {
          model: User,
          as: "trader",
          attributes: ["id", "name", "businessName"],
        },
      ],
    });

    if (!vegetable || !vegetable.isAvailable) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "This item is no longer available",
      });
    }

    // Check stock quantity
    if (parseFloat(vegetable.quantity) < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Only ${vegetable.quantity} ${vegetable.unit} available`,
      });
    }

    // Check min order quantity
    if (quantity < parseFloat(vegetable.minOrderQuantity)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${vegetable.minOrderQuantity} ${vegetable.unit}`,
      });
    }

    const amount = parseFloat(vegetable.rate) * quantity;

    // Create order
    const order = await Order.create(
      {
        customerId: req.userId,
        customerName: req.user.name,
        customerPhone: req.user.phone,
        totalAmount: amount,
        finalAmount: amount,
        deliveryStreet: deliveryStreet || req.user.addressStreet,
        deliveryCity: deliveryCity || req.user.addressCity,
        deliveryState: deliveryState || req.user.addressState,
        deliveryPincode: deliveryPincode || req.user.addressPincode,
        deliveryLandmark,
        deliveryDate,
        deliverySlot,
        paymentMethod: paymentMethod || "cod",
        notes: notes || `Market order for ${vegetable.name}`,
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: `Market order placed for ${quantity} ${vegetable.unit} of ${vegetable.name}`,
          },
        ],
      },
      { transaction },
    );

    // Create order item
    await OrderItem.create(
      {
        orderId: order.id,
        vegetableId: vegetable.id,
        vegetableName: vegetable.name,
        quantity,
        unit: vegetable.unit,
        rate: vegetable.rate,
        amount,
        traderId: vegetable.traderId,
      },
      { transaction },
    );

    // Deduct stock from the vegetable
    const newQuantity = parseFloat(vegetable.quantity) - quantity;
    await vegetable.update(
      {
        quantity: newQuantity,
        isAvailable: newQuantity > 0,
      },
      { transaction },
    );

    // Update buyer stats
    await User.increment(
      { totalOrders: 1, totalSpent: amount },
      { where: { id: req.userId }, transaction },
    );

    await transaction.commit();

    // Send notification to trader
    await createNotification(
      vegetable.traderId,
      "New Market Order!",
      `${req.user.name} ordered ${quantity} ${vegetable.unit} of ${vegetable.name} for ₹${amount.toFixed(2)}`,
      "order",
      order.id,
    );

    // Emit socket events
    socketIO.emitToUser(vegetable.traderId, "new_market_order", {
      orderId: order.id,
      vegetableName: vegetable.name,
      quantity,
      buyerName: req.user.name,
    });
    socketIO.emitEvent("stock_updated", {
      vegetableId: vegetable.id,
      newQuantity,
    });

    // Fetch complete order
    const completeOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: { order: completeOrder },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create market order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  createMarketOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
};
