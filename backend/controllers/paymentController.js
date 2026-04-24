const Razorpay = require("razorpay");

exports.createOrder = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const { amount } = req.body;
    const amountNum = Number(amount);

    // Validate amount
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Check ENV keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay keys:", {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET ? "present" : "missing"
      });
      return res.status(500).json({ message: "Razorpay keys missing in environment" });
    }

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create order (amount in paise)
    const order = await razorpay.orders.create({
      amount: Math.round(amountNum * 100),
      currency: "INR",
      receipt: "ft_" + Date.now()
    });

    console.log("Order created:", order);

    // Send order + key to frontend so key is never hardcoded in JS
    res.status(200).json({
      ...order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error("RAZORPAY ERROR:", err);
    res.status(500).json({
      message: "Order creation failed",
      error: err.message
    });
  }
};