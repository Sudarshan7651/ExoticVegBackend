const OrderModification = require('../models/OrderModification');
const Order = require('../models/Order');

// Create order modification request
exports.createModificationRequest = async (req, res) => {
  try {
    const { orderId, modificationType, currentValue, requestedValue, reason } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const requestedBy = req.user.role === 'buyer' ? 'buyer' : 'trader';

    // Check if user can modify
    if (requestedBy === 'buyer' && order.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this order' });
    }

    const modification = await OrderModification.create({
      orderId,
      requestedBy,
      modificationType,
      currentValue,
      requestedValue,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Modification request submitted successfully',
      data: modification,
    });
  } catch (error) {
    console.error('Create modification request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit modification request' });
  }
};

// Get modification requests for an order
exports.getOrderModifications = async (req, res) => {
  try {
    const { orderId } = req.params;

    const modifications = await OrderModification.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: modifications,
    });
  } catch (error) {
    console.error('Get order modifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch modification requests' });
  }
};

// Get user's modification requests
exports.getUserModifications = async (req, res) => {
  try {
    const modifications = await OrderModification.findAll({
      include: [{
        model: Order,
        where: { customerId: req.user.id },
        attributes: ['id', 'totalAmount', 'status'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: modifications,
    });
  } catch (error) {
    console.error('Get user modifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch modification requests' });
  }
};

// Process modification request
exports.processModificationRequest = async (req, res) => {
  try {
    const { status, responseReason } = req.body;
    const { id } = req.params;

    const modification = await OrderModification.findByPk(id);
    if (!modification) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    if (modification.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Modification request already processed' });
    }

    modification.status = status;
    modification.respondedAt = new Date();
    modification.responseReason = responseReason;

    await modification.save();

    // If approved, update the order
    if (status === 'approved') {
      const order = await Order.findByPk(modification.orderId);
      if (order) {
        if (modification.modificationType === 'cancellation') {
          order.status = 'cancelled';
        } else if (modification.modificationType === 'quantity') {
          order.quantity = parseInt(modification.requestedValue);
          order.totalAmount = order.quantity * order.rate;
        }
        await order.save();
      }
    }

    res.json({
      success: true,
      message: `Modification request ${status} successfully`,
      data: modification,
    });
  } catch (error) {
    console.error('Process modification request error:', error);
    res.status(500).json({ success: false, message: 'Failed to process modification request' });
  }
};
