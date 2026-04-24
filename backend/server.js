require("dotenv").config(); // Must be first

const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ── Routes ──────────────────────────────────────────────
const busRoutes     = require("./routes/busRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes    = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/buses",    busRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/payment",  paymentRoutes);

app.get("/", (req, res) => {
  res.send("Fun Travels API is running 🚀");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});