const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    busNumber: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    busType: { type: String, required: true },
    rating: { type: Number, default: 4.0 },
    amenities: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);