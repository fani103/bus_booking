const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

const normalizePhone = (phone) => {
  return phone?.toString().replace(/\s+/g, "").trim();
};

const makeBookingId = () => {
  return "FT" + Date.now().toString().slice(-8);
};

const sendBookingEmail = async (booking) => {
  if (!booking.email) {
    console.log("Email skipped: passenger email not provided");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });

  const html = `
  <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.1);">
      <div style="background:#0f766e;color:white;padding:22px;text-align:center;">
        <h2 style="margin:0;">Fun Travels 🚀</h2>
        <p style="margin:8px 0 0;">Booking Confirmed ✅</p>
      </div>

      <div style="padding:22px;">
        <h2 style="color:#16a34a;margin-top:0;">Booking Confirmed ✅</h2>
        <p>Hello <b>${booking.passenger}</b>,</p>
        <p>Your bus ticket has been booked successfully.</p>

        <div style="background:#f1f5f9;padding:16px;border-radius:12px;margin-top:18px;border:1px solid #e5e7eb;">
          <h3 style="margin-top:0;color:#111827;">Ticket Details</h3>
          <p><b>Booking ID:</b> ${booking.bookingId}</p>
          <p><b>Route:</b> ${booking.from} → ${booking.to}</p>
          <p><b>Date:</b> ${booking.date}</p>
          <p><b>Bus:</b> ${booking.operator}</p>
          <p><b>Bus Type:</b> ${booking.type}</p>
          <p><b>Seats:</b> ${booking.seats.join(", ")}</p>
          <p><b>Total Amount:</b> ₹${booking.grandTotal}</p>
          <p><b>Status:</b> <span style="color:#16a34a;font-weight:bold;">${booking.status}</span></p>
        </div>

        <div style="margin-top:20px;background:#ecfeff;border-left:5px solid #06b6d4;padding:12px;border-radius:10px;">
          Please arrive at the boarding point at least <b>20 minutes early</b>.
        </div>

        <p style="margin-top:24px;">Thank you for choosing <b>Fun Travels</b> ❤️</p>
      </div>

      <div style="background:#111827;color:#d1d5db;text-align:center;padding:14px;font-size:13px;">
        © 2026 Fun Travels. Happy Journey!
      </div>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"Fun Travels" <${process.env.EMAIL}>`,
    to: booking.email,
    subject: "Booking Confirmed - Fun Travels",
    html,
  });

  console.log("Real email sent ✅ to:", booking.email);
};

exports.createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    if (!bookingData.phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    if (!Array.isArray(bookingData.seats) || bookingData.seats.length === 0) {
      return res.status(400).json({ message: "Seats are required" });
    }

    const existing = await Booking.find({
      operator: bookingData.operator,
      date: bookingData.date,
      status: "CONFIRMED",
    });

    const takenSeats = existing.flatMap((item) => item.seats || []);
    const clash = bookingData.seats.find((seat) => takenSeats.includes(seat));

    if (clash) {
      return res.status(400).json({
        message: `Seat ${clash} already booked`,
      });
    }

    const newBooking = new Booking({
      bookingId: makeBookingId(),
      ...bookingData,
      phone: normalizePhone(bookingData.phone),
      status: "CONFIRMED",
      paidAt: new Date().toLocaleString("en-IN"),
    });

    await newBooking.save();

    const qrData = `
Booking ID: ${newBooking.bookingId}
Name: ${newBooking.passenger}
Route: ${newBooking.from} → ${newBooking.to}
Seats: ${newBooking.seats.join(", ")}
`;

    const qrImage = await QRCode.toDataURL(qrData);

    try {
      await sendBookingEmail(newBooking);
    } catch (emailError) {
      console.log("Email failed ❌:", emailError.message);
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
      qr: qrImage,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      message: "Booking failed",
      error: error.message,
    });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone);

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const bookings = await Booking.find({
      phone: { $regex: phone, $options: "i" },
    }).sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "CANCELLED";
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      message: "Cancel failed",
      error: error.message,
    });
  }
};