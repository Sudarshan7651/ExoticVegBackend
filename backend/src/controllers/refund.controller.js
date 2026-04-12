const RefundRequest = require('../models/RefundRequest');
const Order = require('../models/Order');

// Create refund request
exports.createRefundRequest = async (req, res) => {
  try {
    const { orderId, reason, description, refundAmount } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to request refund for this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    const refundRequest = await RefundRequest.create({
      orderId,
      reason,
      description,
      refundAmount,
    });

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: refundRequest,
    });
  } catch (error) {
    console.error('Refund request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit refund request' });
  }
};

// Get all refund requests (admin only)
exports.getAllRefundRequests = async (req, res) => {
  try {
    const refundRequests = await RefundRequest.findAll({
      include: [{
        model: Order,
        attributes: ['id', 'totalAmount', 'status'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: refundRequests,
    });
  } catch (error) {
    console.error('Get refund requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch refund requests' });
  }
};

// Get user's refund requests
exports.getUserRefundRequests = async (req, res) => {
  try {
    const refundRequests = await RefundRequest.findAll({
      include: [{
        model: Order,
        where: { customerId: req.user.id },
        attributes: ['id', 'totalAmount', 'status'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: refundRequests,
    });
  } catch (error) {
    console.error('Get user refund requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch refund requests' });
  }
};

// Process refund request (admin only)
exports.processRefundRequest = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    const refundRequest = await RefundRequest.findByPk(id);
    if (!refundRequest) {
      return res.status(404).json({ success: false, message: 'Refund request not found' });
    }

    if (refundRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Refund request already processed' });
    }

    refundRequest.status = status;
    refundRequest.processedAt = new Date();
    refundRequest.processedBy = req.user.id;
    if (status === 'rejected' && rejectionReason) {
      refundRequest.rejectionReason = rejectionReason;
    }

    await refundRequest.save();

    // If approved, update order status
    if (status === 'approved') {
      const order = await Order.findByPk(refundRequest.orderId);
      if (order) {
        order.status = 'cancelled';
        await order.save();
      }
    }

    res.json({
      success: true,
      message: `Refund request ${status} successfully`,
      data: refundRequest,
    });
  } catch (error) {
    console.error('Process refund request error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund request' });
  }
};
