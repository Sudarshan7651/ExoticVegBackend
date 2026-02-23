const { Op } = require("sequelize");
const { Vegetable, User } = require("../models");
const socketIO = require("../utils/socket");

/**
 * @desc    Get all vegetables
 * @route   GET /api/vegetables
 * @access  Public
 */
const getAllVegetables = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      isOrganic,
      trader,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isAvailable: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (minPrice || maxPrice) {
      where.rate = {};
      if (minPrice) where.rate[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.rate[Op.lte] = parseFloat(maxPrice);
    }

    if (isOrganic === "true") {
      where.isOrganic = true;
    }

    if (trader) {
      where.traderId = trader;
    }

    const { count, rows: vegetables } = await Vegetable.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "trader",
          attributes: ["id", "name", "businessName"],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        vegetables,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get vegetables error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vegetables",
    });
  }
};

/**
 * @desc    Get vegetable by ID
 * @route   GET /api/vegetables/:id
 * @access  Public
 */
const getVegetableById = async (req, res) => {
  try {
    const vegetable = await Vegetable.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "trader",
          attributes: ["id", "name", "businessName", "phone", "isVerified"],
        },
      ],
    });

    if (!vegetable) {
      return res.status(404).json({
        success: false,
        message: "Vegetable not found",
      });
    }

    res.json({
      success: true,
      data: { vegetable },
    });
  } catch (error) {
    console.error("Get vegetable error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vegetable",
    });
  }
};

/**
 * @desc    Create new vegetable
 * @route   POST /api/vegetables
 * @access  Private/Trader
 */
const createVegetable = async (req, res) => {
  try {
    const vegetableData = {
      ...req.body,
      traderId: req.userId,
      traderName: req.user.businessName || req.user.name,
    };

    const vegetable = await Vegetable.create(vegetableData);

    // Emit socket event for real-time updates
    socketIO.emitEvent("vegetable_added", { vegetable });

    res.status(201).json({
      success: true,
      message: "Vegetable added successfully",
      data: { vegetable },
    });
  } catch (error) {
    console.error("Create vegetable error:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(". "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating vegetable",
    });
  }
};

/**
 * @desc    Update vegetable
 * @route   PUT /api/vegetables/:id
 * @access  Private/Trader
 */
const updateVegetable = async (req, res) => {
  try {
    const vegetable = await Vegetable.findByPk(req.params.id);

    if (!vegetable) {
      return res.status(404).json({
        success: false,
        message: "Vegetable not found",
      });
    }

    // Check ownership (unless admin)
    if (vegetable.traderId !== req.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this vegetable",
      });
    }

    await vegetable.update(req.body);

    // Emit socket event for real-time updates
    socketIO.emitEvent("vegetable_updated", { vegetable });

    res.json({
      success: true,
      message: "Vegetable updated successfully",
      data: { vegetable },
    });
  } catch (error) {
    console.error("Update vegetable error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vegetable",
    });
  }
};

/**
 * @desc    Delete vegetable
 * @route   DELETE /api/vegetables/:id
 * @access  Private/Trader
 */
const deleteVegetable = async (req, res) => {
  try {
    const vegetable = await Vegetable.findByPk(req.params.id);

    if (!vegetable) {
      return res.status(404).json({
        success: false,
        message: "Vegetable not found",
      });
    }

    // Check ownership (unless admin)
    if (vegetable.traderId !== req.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this vegetable",
      });
    }

    // Soft delete
    vegetable.isAvailable = false;
    await vegetable.save();

    // Emit socket event for real-time updates
    socketIO.emitEvent("vegetable_deleted", { id: req.params.id });

    res.json({
      success: true,
      message: "Vegetable removed successfully",
    });
  } catch (error) {
    console.error("Delete vegetable error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting vegetable",
    });
  }
};

/**
 * @desc    Get vegetables by trader
 * @route   GET /api/vegetables/trader/:traderId
 * @access  Public
 */
const getVegetablesByTrader = async (req, res) => {
  try {
    const vegetables = await Vegetable.findAll({
      where: {
        traderId: req.params.traderId,
        isAvailable: true,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: { vegetables },
    });
  } catch (error) {
    console.error("Get trader vegetables error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vegetables",
    });
  }
};

/**
 * @desc    Get vegetable categories
 * @route   GET /api/vegetables/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    const vegetables = await Vegetable.findAll({
      attributes: ["category"],
      group: ["category"],
      where: { isAvailable: true },
    });

    const categories = vegetables.map((v) => v.category);

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
};

module.exports = {
  getAllVegetables,
  getVegetableById,
  createVegetable,
  updateVegetable,
  deleteVegetable,
  getVegetablesByTrader,
  getCategories,
};
