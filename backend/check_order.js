const { SpecialOrder, TraderQuote } = require("./src/models");
const { sequelize } = require("./src/config/database");
const { Op } = require("sequelize");
require("dotenv").config();

async function checkOrder() {
  try {
    const orderNumber = "SR26010796";
    console.log(`Searching for order: ${orderNumber}`);

    // Test DB connection first
    await sequelize.authenticate();
    console.log("DB Connection authenticated.");

    const order = await SpecialOrder.findOne({
      where: {
        requestNumber: {
          [Op.iLike]: orderNumber,
        },
      },
      include: [
        {
          model: TraderQuote,
          as: "quotes",
        },
      ],
    });

    if (!order) {
      console.log("Order not found");
      return;
    }

    console.log("Order Details:");
    console.log(`ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Accepted Quote ID: ${order.acceptedQuoteId}`);
    console.log(`Vegetable: ${order.vegetableName}`);
    console.log("Quotes Count:", order.quotes.length);

    order.quotes.forEach((q) => {
      console.log(
        `Quote ID: ${q.id}, Trader: ${q.traderName}, Status: ${q.status}`,
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkOrder();
