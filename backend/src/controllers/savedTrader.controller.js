const { SavedTrader, User } = require("../models");

/**
 * @desc    Save a trader
 * @route   POST /api/saved-traders
 * @access  Private (Buyer)
 */
const saveTrader = async (req, res) => {
  try {
    const { traderId } = req.body;
    const buyerId = req.userId;

    // Check if trader exists and is a trader
    const trader = await User.findOne({
      where: { id: traderId, role: "trader" },
    });

    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    // Check if already saved
    const existingSave = await SavedTrader.findOne({
      where: { buyerId, traderId },
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: "Trader already saved",
      });
    }

    const savedTrader = await SavedTrader.create({
      buyerId,
      traderId,
    });

    res.status(201).json({
      success: true,
      message: "Trader saved successfully",
      data: savedTrader,
    });
  } catch (error) {
    console.error("Save trader error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving trader",
    });
  }
};

/**
 * @desc    Unsave a trader
 * @route   DELETE /api/saved-traders/:traderId
 * @access  Private (Buyer)
 */
const unsaveTrader = async (req, res) => {
  try {
    const { traderId } = req.params;
    const buyerId = req.userId;

    const result = await SavedTrader.destroy({
      where: { buyerId, traderId },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Saved trader record not found",
      });
    }

    res.json({
      success: true,
      message: "Trader unsaved successfully",
    });
  } catch (error) {
    console.error("Unsave trader error:", error);
    res.status(500).json({
      success: false,
      message: "Error unsaving trader",
    });
  }
};

/**
 * @desc    Get all saved traders for a buyer
 * @route   GET /api/saved-traders
 * @access  Private (Buyer)
 */
const getSavedTraders = async (req, res) => {
  try {
    const buyerId = req.userId;

    const savedTraders = await SavedTrader.findAll({
      where: { buyerId },
      include: [
        {
          model: User,
          as: "trader",
          attributes: [
            "id",
            "name",
            "businessName",
            "profileImage",
            "rating",
            "ratingCount",
            "addressCity",
            "addressState",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: savedTraders.map((s) => s.trader),
    });
  } catch (error) {
    console.error("Get saved traders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved traders",
    });
  }
};

module.exports = {
  saveTrader,
  unsaveTrader,
  getSavedTraders,
};
