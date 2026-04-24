const express = require("express");
const app = express();

app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// bookings API (your frontend needs this)
app.get("/api/bookings", (req, res) => {
  const phone = req.query.phone;

  res.json({
    success: true,
    phone,
    bookings: [
      { id: 1, from: "City A", to: "City B" }
    ]
  });
});

app.listen(8080, () => {
  console.log("Server running on http://localhost:5000");
});