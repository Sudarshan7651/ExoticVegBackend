const { Op } = require("sequelize");
const {
  sequelize,
  SpecialOrder,
  TraderQuote,
  User,
  Notification,
} = require("../models");
const socketIO = require("../utils/socket");
const { createNotification } = require("./notification.controller");

/**
 * @desc    Get all special orders
 * @route   GET /api/special-orders
 * @access  Private
 */
const getAllSpecialOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let where = {};

    // Buyers see only their own orders
    if (req.user.role === "buyer") {
      where.customerId = req.userId;
    }

    // Traders see all open and quoted orders (available for bidding)
    if (req.user.role === "trader") {
      // Show orders that are open or quoted (still accepting quotes)
      where.status = {
        [Op.in]: ["open", "quoted"],
      };
    }

    // If status filter is provided, apply it
    if (status && status !== "all") {
      where.status = status;
    }

    // Search functionality
    if (search) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        [Op.or]: [
          { vegetableName: { [Op.iLike]: `%${search}%` } },
          { deliveryLocation: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const queryOptions = {
      where,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "phone"],
        },
        {
          model: TraderQuote,
          as: "quotes",
          include: [
            {
              model: User,
              as: "trader",
              attributes: ["id", "name", "businessName", "isVerified"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    };

    const { count, rows: specialOrders } =
      await SpecialOrder.findAndCountAll(queryOptions);

    // Filter payment status based on user role
    const filteredOrders = specialOrders.map((order) => {
      const orderData = order.toJSON();
      if (req.user.role === "buyer") {
        // Buyer sees only their payment status
        orderData.paymentStatus = orderData.buyerPaymentStatus;
        delete orderData.buyerPaymentStatus;
        delete orderData.traderPaymentStatus;
      } else if (req.user.role === "trader") {
        // Trader sees only their payment status
        orderData.paymentStatus = orderData.traderPaymentStatus;
        delete orderData.buyerPaymentStatus;
        delete orderData.traderPaymentStatus;
      }
      return orderData;
    });

    res.json({
      success: true,
      data: {
        specialOrders: filteredOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get special orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching special orders",
    });
  }
};

/**
 * @desc    Get special order by ID
 * @route   GET /api/special-orders/:id
 * @access  Private
 */
const getSpecialOrderById = async (req, res) => {
  try {
    const specialOrder = await SpecialOrder.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: TraderQuote,
          as: "quotes",
          include: [
            {
              model: User,
              as: "trader",
              attributes: ["id", "name", "businessName", "phone", "isVerified"],
            },
          ],
        },
      ],
    });

    if (!specialOrder) {
      return res.status(404).json({
        success: false,
        message: "Special order not found",
      });
    }

    // Filter payment status based on user role
    const responseData = specialOrder.toJSON();
    if (req.user.role === "buyer") {
      // Buyer sees only their payment status
      responseData.paymentStatus = responseData.buyerPaymentStatus;
      delete responseData.buyerPaymentStatus;
      delete responseData.traderPaymentStatus;
    } else if (req.user.role === "trader") {
      // Trader sees only their payment status
      responseData.paymentStatus = responseData.traderPaymentStatus;
      delete responseData.buyerPaymentStatus;
      delete responseData.traderPaymentStatus;
    }

    res.json({
      success: true,
      data: { specialOrder: responseData },
    });
  } catch (error) {
    console.error("Get special order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching special order",
    });
  }
};

/**
 * @desc    Create special order request
 * @route   POST /api/special-orders
 * @access  Private/Buyer
 */
const createSpecialOrder = async (req, res) => {
  try {
    const {
      vegetableName,
      quantity,
      unit,
      requiredBy,
      description,
      budgetMin,
      budgetMax,
      deliveryLocation,
      deliveryAddress,
      latitude,
      longitude,
    } = req.body;

    const specialOrder = await SpecialOrder.create({
      customerId: req.userId,
      customerName: req.user.name,
      vegetableName,
      quantity,
      unit,
      requiredBy,
      description,
      budgetMin,
      budgetMax,
      deliveryLocation,
      deliveryAddress,
      latitude,
      longitude,
    });

    // Emit socket event to notify traders about new special order
    socketIO.emitEvent("special_order_added", { specialOrder });

    res.status(201).json({
      success: true,
      message: "Special order request created",
      data: { specialOrder },
    });
  } catch (error) {
    console.error("Create special order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating special order",
    });
  }
};

/**
 * @desc    Submit quote for special order
 * @route   POST /api/special-orders/:id/quote
 * @access  Private/Trader
 */
const submitQuote = async (req, res) => {
  try {
    const { quotedPrice, pricePerUnit, estimatedDelivery, message } = req.body;

    const specialOrder = await SpecialOrder.findByPk(req.params.id);

    if (!specialOrder) {
      return res.status(404).json({
        success: false,
        message: "Special order not found",
      });
    }

    if (specialOrder.status !== "open" && specialOrder.status !== "quoted") {
      return res.status(400).json({
        success: false,
        message: "Cannot submit quote for this order",
      });
    }

    // Check if trader already submitted a quote
    const existingQuote = await TraderQuote.findOne({
      where: {
        specialOrderId: req.params.id,
        traderId: req.userId,
      },
    });

    if (existingQuote) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a quote for this order",
      });
    }

    // Create quote
    const quote = await TraderQuote.create({
      specialOrderId: req.params.id,
      traderId: req.userId,
      traderName: req.user.businessName || req.user.name,
      quotedPrice,
      pricePerUnit,
      estimatedDelivery,
      message,
    });

    // Notify buyer about new quote
    await createNotification(
      specialOrder.customerId,
      "New Quote Received",
      `${req.user.businessName || req.user.name} submitted a quote of ₹${quotedPrice} for your ${specialOrder.vegetableName} request.`,
      "quote",
      specialOrder.id,
    );

    // Update status to quoted if first quote
    if (specialOrder.status === "open") {
      specialOrder.status = "quoted";
      await specialOrder.save();
    }

    // Emit socket event for updated order (status might have changed)
    socketIO.emitEvent("special_order_updated", { specialOrder });

    res.status(201).json({
      success: true,
      message: "Quote submitted successfully",
      data: { quote },
    });
  } catch (error) {
    console.error("Submit quote error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting quote",
    });
  }
};

/**
 * @desc    Accept a quote
 * @route   PUT /api/special-orders/:id/accept/:quoteId
 * @access  Private/Buyer
 */
const acceptQuote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const specialOrder = await SpecialOrder.findByPk(req.params.id, {
      transaction,
    });

    if (!specialOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Special order not found",
      });
    }

    // Check status
    if (specialOrder.status !== "open" && specialOrder.status !== "quoted") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot accept quote for an order that is ${specialOrder.status}`,
      });
    }

    // Check ownership
    if (specialOrder.customerId !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const quote = await TraderQuote.findByPk(req.params.quoteId, {
      transaction,
    });

    if (!quote || quote.specialOrderId !== req.params.id) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    // Accept this quote
    quote.status = "accepted";
    await quote.save({ transaction });

    // Reject other quotes
    await TraderQuote.update(
      { status: "rejected" },
      {
        where: {
          specialOrderId: req.params.id,
          id: { [Op.ne]: req.params.quoteId },
        },
        transaction,
      },
    );

    // Update special order
    specialOrder.acceptedQuoteId = req.params.quoteId;
    specialOrder.status = "accepted";
    await specialOrder.save({ transaction });

    // Increment trader's total orders
    await User.increment("totalOrders", {
      where: { id: quote.traderId },
      transaction,
    });

    // Increment buyer's total orders
    await User.increment("totalOrders", {
      where: { id: specialOrder.customerId },
      transaction,
    });

    await transaction.commit();

    // Notify trader that their quote was accepted
    await createNotification(
      quote.traderId,
      "Quote Accepted!",
      `Your quote of ₹${quote.quotedPrice} for ${specialOrder.vegetableName} has been accepted by the buyer.`,
      "quote",
      specialOrder.id,
    );

    // Emit socket event for the accepted order
    socketIO.emitToUser(quote.traderId, "quote_accepted", { specialOrder });

    // Emit general update event
    socketIO.emitEvent("special_order_updated", { specialOrder });

    res.json({
      success: true,
      message: "Quote accepted successfully",
      data: { specialOrder },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Accept quote error:", error);
    res.status(500).json({
      success: false,
      message: "Error accepting quote",
    });
  }
};

/**
 * @desc    Reject a quote
 * @route   PUT /api/special-orders/:id/reject/:quoteId
 * @access  Private/Buyer
 */
const rejectQuote = async (req, res) => {
  try {
    const specialOrder = await SpecialOrder.findByPk(req.params.id);

    if (!specialOrder) {
      return res.status(404).json({
        success: false,
        message: "Special order not found",
      });
    }

    if (specialOrder.customerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const quote = await TraderQuote.findByPk(req.params.quoteId);

    if (!quote || quote.specialOrderId !== req.params.id) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    quote.status = "rejected";
    await quote.save();

    res.json({
      success: true,
      message: "Quote rejected successfully",
    });
  } catch (error) {
    console.error("Reject quote error:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting quote",
    });
  }
};

/**
 * @desc    Close a special order
 * @route   PUT /api/special-orders/:id/close
 * @access  Private/Buyer
 */
const closeSpecialOrder = async (req, res) => {
  try {
    const { fulfilled } = req.body;
    const specialOrder = await SpecialOrder.findByPk(req.params.id);

    if (!specialOrder) {
      return res.status(404).json({
        success: false,
        message: "Special order not found",
      });
    }

    // Check access
    let hasAccess = false;
    if (specialOrder.customerId === req.userId) {
      hasAccess = true;
    } else if (specialOrder.acceptedQuoteId) {
      const acceptedQuote = await TraderQuote.findByPk(
        specialOrder.acceptedQuoteId,
      );
      if (acceptedQuote && acceptedQuote.traderId === req.userId) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update status based on whether order was fulfilled
    specialOrder.status = fulfilled ? "fulfilled" : "closed";
    await specialOrder.save();

    // Emit socket event for updated order
    socketIO.emitEvent("special_order_updated", { specialOrder });

    // Reject any pending quotes
    await TraderQuote.update(
      { status: "rejected" },
      {
        where: {
          specialOrderId: req.params.id,
          status: "pending",
        },
      },
    );

    // Notify buyer if trader marks as fulfilled
    if (fulfilled && req.userId !== specialOrder.customerId) {
      await createNotification(
        specialOrder.customerId,
        "Order Fulfilled",
        `The trader has fulfilled your ${specialOrder.vegetableName} order (#${specialOrder.requestNumber}).`,
        "order",
        specialOrder.id,
      );
    }

    res.json({
      success: true,
      message: fulfilled ? "Order marked as fulfilled" : "Order closed",
      data: { specialOrder },
    });
  } catch (error) {
    console.error("Close special order error:", error);
    res.status(500).json({
      success: false,
      message: "Error closing special order",
    });
  }
};
/**
 * @desc    Get trader's orders (where they have submitted quotes)
 * @route   GET /api/special-orders/my-orders
 * @access  Private/Trader
 */
const getTraderAcceptedOrders = async (req, res) => {
  try {
    const { status } = req.query; // 'accepted', 'pending', or 'all'

    // Build where condition for quotes
    const quoteWhere = {
      traderId: req.userId,
    };

    // Filter by quote status
    if (status === "accepted") {
      quoteWhere.status = "accepted";
    } else if (status === "pending") {
      quoteWhere.status = "pending";
    } else {
      // Default: show both accepted and pending
      quoteWhere.status = {
        [Op.in]: ["accepted", "pending"],
      };
    }

    // Find all quotes by this trader
    const quotes = await TraderQuote.findAll({
      where: quoteWhere,
      include: [
        {
          model: SpecialOrder,
          as: "specialOrder",
          include: [
            {
              model: User,
              as: "customer",
              attributes: ["id", "name", "phone", "email"],
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    // Transform the data to include order details with the quote
    const orders = quotes.map((quote) => ({
      id: quote.specialOrder.id,
      requestNumber: quote.specialOrder.requestNumber,
      vegetableName: quote.specialOrder.vegetableName,
      quantity: quote.specialOrder.quantity,
      unit: quote.specialOrder.unit,
      requiredBy: quote.specialOrder.requiredBy,
      orderStatus: quote.specialOrder.status,
      quoteStatus: quote.status,
      deliveryLocation: quote.specialOrder.deliveryLocation,
      deliveryAddress: quote.specialOrder.deliveryAddress,
      paymentStatus: quote.specialOrder.traderPaymentStatus || "pending",
      createdAt: quote.specialOrder.createdAt,
      customer: quote.specialOrder.customer,
      quote: {
        id: quote.id,
        quotedPrice: quote.quotedPrice,
        pricePerUnit: quote.pricePerUnit,
        estimatedDelivery: quote.estimatedDelivery,
        message: quote.message,
        status: quote.status,
        submittedAt: quote.createdAt,
        updatedAt: quote.updatedAt,
      },
    }));

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  } catch (error) {
    console.error("Get trader orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

/**
 * @desc    Mark payment as received by trader
 * @route   PUT /api/special-orders/:id/trader-payment
 * @access  Private/Trader
 */
const markPaymentReceived = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const specialOrder = await SpecialOrder.findByPk(req.params.id, {
      include: [
        { model: TraderQuote, as: "quotes", where: { status: "accepted" } },
      ],
      transaction,
    });

    if (!specialOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check access: only the trader who won the bid can mark it as paid
    const acceptedQuote = specialOrder.quotes[0];
    if (!acceptedQuote || acceptedQuote.traderId !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (specialOrder.traderPaymentStatus === "received") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Payment already marked as received",
      });
    }

    // Update trader payment status
    specialOrder.traderPaymentStatus = "received";
    await specialOrder.save({ transaction });

    // Increment buyer's total spent now
    await User.increment(
      { totalSpent: parseFloat(acceptedQuote.quotedPrice) },
      { where: { id: specialOrder.customerId }, transaction },
    );

    await transaction.commit();

    // Notify buyer
    await createNotification(
      specialOrder.customerId,
      "Payment Confirmed",
      `Trader has confirmed receipt of payment (₹${acceptedQuote.quotedPrice}) for order #${specialOrder.requestNumber}.`,
      "order",
      specialOrder.id,
    );

    res.json({
      success: true,
      message: "Payment marked as received",
      data: { specialOrder },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Mark payment received error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
    });
  }
};

/**
 * @desc    Mark payment as paid by buyer
 * @route   PUT /api/special-orders/:id/buyer-payment
 * @access  Private/Buyer
 */
const markBuyerPaymentPaid = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const specialOrder = await SpecialOrder.findByPk(req.params.id, {
      include: [
        { model: TraderQuote, as: "quotes", where: { status: "accepted" } },
      ],
      transaction,
    });

    if (!specialOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check access: only the buyer who placed the order can mark payment as paid
    if (specialOrder.customerId !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (specialOrder.buyerPaymentStatus === "paid") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Payment already marked as paid",
      });
    }

    // Update buyer payment status
    specialOrder.buyerPaymentStatus = "paid";
    await specialOrder.save({ transaction });

    await transaction.commit();

    // Notify trader
    const acceptedQuote = specialOrder.quotes[0];
    if (acceptedQuote) {
      await createNotification(
        acceptedQuote.traderId,
        "Payment Initiated",
        `Buyer has marked payment as paid for order #${specialOrder.requestNumber}.`,
        "order",
        specialOrder.id,
      );
    }

    res.json({
      success: true,
      message: "Payment marked as paid",
      data: { specialOrder },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Mark buyer payment paid error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
    });
  }
};

module.exports = {
  getAllSpecialOrders,
  getSpecialOrderById,
  createSpecialOrder,
  submitQuote,
  acceptQuote,
  rejectQuote,
  closeSpecialOrder,
  getTraderAcceptedOrders,
  markPaymentReceived,
  markBuyerPaymentPaid,
};
