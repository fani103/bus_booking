const express = require("express");
const {
  createBooking,
  getMyBookings,
  cancelBooking
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", createBooking);
router.get("/", getMyBookings);
router.put("/:id/cancel", cancelBooking);

module.exports = router;