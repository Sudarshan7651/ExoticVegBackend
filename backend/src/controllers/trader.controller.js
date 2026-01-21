const { Op } = require("sequelize");
const { User, Vegetable, Order, OrderItem } = require("../models");

/**
 * @desc    Get all traders
 * @route   GET /api/traders
 * @access  Public
 */
const getAllTraders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      verified,
      search,
      sortBy = "totalOrders",
    } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: "trader", isActive: true };

    if (verified === "true") {
      where.isVerified = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { businessName: { [Op.iLike]: `%${search}%` } },
      ];
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
        "membershipTier",
        "profileImage",
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, "DESC"]],
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
 * @desc    Get trader by ID with their products
 * @route   GET /api/traders/:id
 * @access  Public
 */
const getTraderById = async (req, res) => {
  try {
    const trader = await User.findOne({
      where: {
        id: req.params.id,
        role: "trader",
        isActive: true,
      },
      attributes: { exclude: ["password"] },
    });

    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    // Get trader's vegetables
    const vegetables = await Vegetable.findAll({
      where: {
        traderId: req.params.id,
        isAvailable: true,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        trader,
        vegetables,
        productCount: vegetables.length,
      },
    });
  } catch (error) {
    console.error("Get trader error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trader",
    });
  }
};

/**
 * @desc    Get trader statistics (for trader dashboard)
 * @route   GET /api/traders/dashboard/stats
 * @access  Private/Trader
 */
const getTraderStats = async (req, res) => {
  try {
    const { SpecialOrder, TraderQuote } = require("../models");

    // Get trader's quotes
    const quotes = await TraderQuote.findAll({
      where: { traderId: req.userId },
      include: [
        {
          model: SpecialOrder,
          as: "specialOrder",
          attributes: ["id", "status", "vegetableName", "quantity", "unit"],
        },
      ],
    });

    // Calculate quote stats
    const acceptedQuotes = quotes.filter((q) => q.status === "accepted");
    const pendingQuotes = quotes.filter((q) => q.status === "pending");
    const rejectedQuotes = quotes.filter((q) => q.status === "rejected");

    // Calculate revenue from accepted quotes
    const totalRevenue = acceptedQuotes.reduce(
      (sum, q) => sum + parseFloat(q.quotedPrice || 0),
      0,
    );

    // Get recent accepted orders
    const recentOrders = acceptedQuotes.slice(0, 5).map((q) => ({
      id: q.specialOrder?.id,
      vegetableName: q.specialOrder?.vegetableName,
      quantity: q.specialOrder?.quantity,
      unit: q.specialOrder?.unit,
      amount: q.quotedPrice,
      status: q.status,
      date: q.updatedAt,
    }));

    const stats = {
      products: 0, // Not using inventory anymore
      orders: {
        total: quotes.length,
        pending: pendingQuotes.length,
        confirmed: acceptedQuotes.length,
        delivered: acceptedQuotes.filter(
          (q) => q.specialOrder?.status === "fulfilled",
        ).length,
        rejected: rejectedQuotes.length,
      },
      revenue: totalRevenue,
      recentOrders,
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get trader stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trader statistics",
    });
  }
};

/**
 * @desc    Verify trader (Admin only)
 * @route   PUT /api/traders/:id/verify
 * @access  Private/Admin
 */
const verifyTrader = async (req, res) => {
  try {
    const trader = await User.findOne({
      where: {
        id: req.params.id,
        role: "trader",
      },
    });

    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    trader.isVerified = true;
    await trader.save();

    res.json({
      success: true,
      message: "Trader verified successfully",
      data: { trader: trader.toSafeJSON() },
    });
  } catch (error) {
    console.error("Verify trader error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying trader",
    });
  }
};

module.exports = {
  getAllTraders,
  getTraderById,
  getTraderStats,
  verifyTrader,
};
