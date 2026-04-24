const User = require("../models/User");

exports.loginOrCreateUser = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({ name, phone, email: email || "" });
    } else {
      user.name = name;
      user.email = email || user.email;
      await user.save();
    }

    res.json({
      message: "Login successful",
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};