const { Review, User, Order, SpecialOrder } = require("../models");

/**
 * @desc    Create a new review for a trader
 * @route   POST /api/reviews
 * @access  Private (Buyer)
 */
const createReview = async (req, res) => {
  try {
    const { traderId, orderId, rating, comment } = req.body;
    const buyerId = req.userId;

    // Check if trader exists
    const trader = await User.findOne({
      where: { id: traderId, role: "trader" },
    });

    if (!trader) {
      return res.status(404).json({
        success: false,
        message: "Trader not found",
      });
    }

    // Check if order exists and belongs to the buyer
    // It can be a regular Order or a SpecialOrder
    let isSpecialOrder = false;
    if (orderId) {
      const order = await Order.findByPk(orderId);
      const specialOrder = !order ? await SpecialOrder.findByPk(orderId) : null;

      const foundOrder = order || specialOrder;
      isSpecialOrder = !order && !!specialOrder;

      if (!foundOrder || foundOrder.customerId !== buyerId) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }
    }

    // Create review - don't set orderId for special orders to avoid FK constraint
    const review = await Review.create({
      buyerId,
      traderId,
      orderId: isSpecialOrder ? null : orderId, // Only set orderId for regular orders
      rating: parseInt(rating),
      comment,
    });

    // Update trader's average rating
    const reviews = await Review.findAll({
      where: { traderId },
      attributes: ["rating"],
    });

    const ratingCount = reviews.length;
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount;

    await User.update(
      {
        rating: avgRating,
        ratingCount: ratingCount,
      },
      { where: { id: traderId } },
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting review",
    });
  }
};

/**
 * @desc    Get all reviews for a trader
 * @route   GET /api/reviews/trader/:traderId
 * @access  Public
 */
const getTraderReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { traderId: req.params.traderId },
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "profileImage"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
    });
  }
};

module.exports = {
  createReview,
  getTraderReviews,
};
