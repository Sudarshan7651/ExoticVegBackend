const { Op } = require("sequelize");
const { User } = require("../models");

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      businessName,
      addressStreet,
      addressCity,
      addressState,
      addressPincode,
      gstNumber,
    } = req.body;

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (businessName) user.businessName = businessName;
    if (addressStreet) user.addressStreet = addressStreet;
    if (addressCity) user.addressCity = addressCity;
    if (addressState) user.addressState = addressState;
    if (addressPincode) user.addressPincode = addressPincode;
    if (gstNumber) user.gstNumber = gstNumber;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

/**
 * @desc    Update user by ID (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive, isVerified, membershipTier } =
      req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (typeof isVerified === "boolean") user.isVerified = isVerified;
    if (membershipTier) user.membershipTier = membershipTier;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete - deactivate instead of removing
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

/**
 * @desc    Get all traders
 * @route   GET /api/users/traders
 * @access  Public
 */
const getTraders = async (req, res) => {
  try {
    const { page = 1, limit = 20, verified } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: "trader", isActive: true };

    if (verified === "true") {
      where.isVerified = true;
    }

    const { count, rows: traders } = await User.findAndCountAll({
      where,
      attributes: [
        "id",
        "name",
        "businessName",
        "phone",
        "isVerified",
        "totalOrders",
        "addressCity",
        "addressState",
        "rating",
        "ratingCount",
        "profileImage",
      ],
      limit: parseInt(limit),
      offset,
      order: [["totalOrders", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        traders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get traders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching traders",
    });
  }
};

/**
 * @desc    Get buyer dashboard stats
 * @route   GET /api/buyer/dashboard
 * @access  Private/Buyer
 */
const getBuyerDashboard = async (req, res) => {
  try {
    const { SpecialOrder, TraderQuote } = require("../models");
    const { filter = "month" } = req.query;

    // Calculate date range based on filter
    const now = new Date();
    let startDate;

    switch (filter) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get buyer's special orders with accepted quotes
    const orders = await SpecialOrder.findAll({
      where: {
        customerId: req.userId,
        createdAt: { [Op.gte]: startDate },
      },
      include: [
        {
          model: TraderQuote,
          as: "quotes",
          where: { status: "accepted" },
          required: false,
          include: [
            {
              model: User,
              as: "trader",
              attributes: ["id", "name", "businessName", "isVerified"],
            },
          ],
        },
      ],
    });

    // Calculate summary
    let totalSpend = 0;
    let totalQuantity = 0;
    const vegetableMap = {};
    const traderMap = {};

    const CHART_COLORS = [
      "#4CAF50",
      "#2196F3",
      "#FF9800",
      "#E91E63",
      "#9C27B0",
      "#00BCD4",
      "#FF5722",
      "#795548",
    ];
    let colorIndex = 0;

    orders.forEach((order) => {
      const acceptedQuote = order.quotes?.find((q) => q.status === "accepted");
      const orderAmount = acceptedQuote
        ? parseFloat(acceptedQuote.quotedPrice)
        : 0;

      totalSpend += orderAmount;
      totalQuantity += parseFloat(order.quantity) || 0;

      // Group by vegetable
      const vegName = order.vegetableName || "Other";
      if (!vegetableMap[vegName]) {
        vegetableMap[vegName] = {
          name: vegName,
          spend: 0,
          quantity: 0,
          color: CHART_COLORS[colorIndex % CHART_COLORS.length],
        };
        colorIndex++;
      }
      vegetableMap[vegName].spend += orderAmount;
      vegetableMap[vegName].quantity += parseFloat(order.quantity) || 0;

      // Group by trader
      if (acceptedQuote?.trader) {
        const traderId = acceptedQuote.trader.id;
        if (!traderMap[traderId]) {
          traderMap[traderId] = {
            id: traderId,
            name: acceptedQuote.trader.name,
            businessName: acceptedQuote.trader.businessName,
            isVerified: acceptedQuote.trader.isVerified,
            totalSpend: 0,
            ordersCount: 0,
          };
        }
        traderMap[traderId].totalSpend += orderAmount;
        traderMap[traderId].ordersCount++;
      }
    });

    // Convert maps to arrays and sort
    const vegetableExpenses = Object.values(vegetableMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    const topTraders = Object.values(traderMap)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalSpend,
          totalQuantity,
          totalOrders: orders.length,
        },
        vegetableExpenses,
        topTraders,
      },
    });
  } catch (error) {
    console.error("Get buyer dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
    });
  }
};

/**
 * @desc    Get current user statistics
 * @route   GET /api/users/stats
 * @access  Private
 */
const getUserStats = async (req, res) => {
  try {
    const { Order, SpecialOrder, TraderQuote } = require("../models");

    // Get regular order stats
    const regularOrders = await Order.findAll({
      where: { customerId: req.userId },
      attributes: ["status", "finalAmount"],
    });

    // Get special orders with accepted quotes
    const specialOrders = await SpecialOrder.findAll({
      where: { customerId: req.userId },
      include: [
        {
          model: TraderQuote,
          as: "quotes",
          where: { status: "accepted" },
          required: false,
        },
      ],
    });

    let totalOrders = regularOrders.length + specialOrders.length;
    let totalSpent = 0;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let deliveredOrders = 0;

    // Process regular orders
    regularOrders.forEach((order) => {
      if (order.status !== "cancelled") {
        totalSpent += parseFloat(order.finalAmount || 0);
      }
      if (order.status === "pending") pendingOrders++;
      if (
        order.status === "confirmed" ||
        order.status === "processing" ||
        order.status === "shipped"
      )
        confirmedOrders++;
      if (order.status === "delivered") deliveredOrders++;
    });

    // Process special orders
    specialOrders.forEach((so) => {
      const acceptedQuote = so.quotes?.find((q) => q.status === "accepted");
      if (
        acceptedQuote &&
        so.status !== "cancelled" &&
        so.status !== "closed"
      ) {
        totalSpent += parseFloat(acceptedQuote.quotedPrice || 0);
      }

      if (so.status === "open" || so.status === "quoted") pendingOrders++;
      if (so.status === "accepted") confirmedOrders++;
      if (so.status === "fulfilled" || so.status === "closed")
        deliveredOrders++;
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        totalSpent,
        specialOrders: specialOrders.length,
        breakdown: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          delivered: deliveredOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  getTraders,
  getBuyerDashboard,
  getUserStats,
};
