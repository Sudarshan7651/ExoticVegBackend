const Review = require('../models/Review');

// Get pending reviews for moderation
exports.getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending reviews' });
  }
};

// Moderate review (approve/reject)
exports.moderateReview = async (req, res) => {
  try {
    const { status, moderationReason } = req.body;
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Review already moderated' });
    }

    review.status = status;
    if (status === 'rejected' && moderationReason) {
      review.moderationReason = moderationReason;
    }

    await review.save();

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: review,
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ success: false, message: 'Failed to moderate review' });
  }
};

// Get all reviews with moderation status
exports.getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const reviews = await Review.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};
