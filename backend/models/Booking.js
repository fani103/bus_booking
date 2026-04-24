const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true
    },
    passenger: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ""
    },
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    seats: {
      type: [String],
      required: true
    },
    boarding: {
      type: String,
      required: true
    },
    dropping: {
      type: String,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    grandTotal: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      default: "CONFIRMED"
    },
    paidAt: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);