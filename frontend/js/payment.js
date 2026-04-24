const API_BASE = "http://127.0.0.1:5000/api";

// ── DOM refs ─────────────────────────────────────────────
const tripInfo      = document.getElementById("tripInfo");
const payOptions    = document.querySelectorAll(".pay-option");
const payBtn        = document.getElementById("payBtn");
const userNameInput = document.getElementById("userName");
const phoneInput    = document.getElementById("phone");
const emailInput    = document.getElementById("email");

// ── State ────────────────────────────────────────────────
let bookingDraft    = {};
let user            = {};
let selectedPayment = "UPI";

try { bookingDraft = JSON.parse(localStorage.getItem("ft_booking_draft") || "{}"); } catch { bookingDraft = {}; }
try { user         = JSON.parse(localStorage.getItem("ft_user")          || "{}"); } catch { user = {}; }

// ── Guards ───────────────────────────────────────────────
if (!user.isLoggedIn) {
  localStorage.setItem("ft_redirect_after_login", "payment.html");
  window.location.href = "login.html";
}

if (!bookingDraft.operator || !bookingDraft.seats?.length) {
  alert("No booking found. Please search again.");
  window.location.href = "results.html";
}

// ── Helpers ──────────────────────────────────────────────
const escHtml = str =>
  str ? String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "-";

const validatePhone = phone => /^[6-9]\d{9}$/.test(phone);
const validateEmail = email => !email || /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);

function setLoadingState(isLoading) {
  payBtn.disabled    = isLoading;
  payBtn.textContent = isLoading ? "Processing..." : "Pay & Confirm Booking";
}

// ── Trip Summary ─────────────────────────────────────────
if (tripInfo) {
  tripInfo.innerHTML = `
    <div class="summary-list">
      <div class="summary-item"><span>Route</span><strong>${escHtml(bookingDraft.from)} → ${escHtml(bookingDraft.to)}</strong></div>
      <div class="summary-item"><span>Date</span><strong>${escHtml(bookingDraft.date)}</strong></div>
      <div class="summary-item"><span>Operator</span><strong>${escHtml(bookingDraft.operator)}</strong></div>
      <div class="summary-item"><span>Bus Type</span><strong>${escHtml(bookingDraft.type)}</strong></div>
      <div class="summary-item"><span>Seats</span><strong>${bookingDraft.seats.join(", ")}</strong></div>
      <div class="summary-item" style="background:#f0f9ff">
        <span>Total</span>
        <strong style="color:#2563eb;font-size:18px">₹${bookingDraft.total}</strong>
      </div>
    </div>
  `;
}

// ── Prefill user ─────────────────────────────────────────
userNameInput.value = user.name  || "";
phoneInput.value    = user.phone || "";
emailInput.value    = user.email || "";

// ── Payment method toggle ────────────────────────────────
payOptions.forEach(btn => {
  btn.addEventListener("click", () => {
    payOptions.forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    selectedPayment = btn.dataset.value;
  });
});

// ── MAIN PAYMENT FLOW ────────────────────────────────────
payBtn?.addEventListener("click", async () => {
  const passenger = userNameInput.value.trim();
  const phone     = phoneInput.value.trim();
  const email     = emailInput.value.trim();

  // Validation
  if (!passenger)                          return alert("Enter passenger name");
  if (!validatePhone(phone))               return alert("Enter a valid 10-digit phone number");
  if (email && !validateEmail(email))      return alert("Enter a valid email");

  setLoadingState(true);

  try {
    // Save user info locally
    localStorage.setItem("ft_user", JSON.stringify({
      ...user,
      name: passenger,
      phone,
      email,
      isLoggedIn: true
    }));

    // 1️⃣ Create Razorpay order via backend
    const res = await fetch(`${API_BASE}/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(bookingDraft.total) })
    });

    const order = await res.json();
    console.log("Order response:", order);

    if (!res.ok || !order.id) {
      throw new Error(order.error || order.message || "Failed to create payment order");
    }

    // 2️⃣ Open Razorpay checkout
    // Key is returned from the server — never hardcode it here
    const options = {
      key:         order.key,
      amount:      order.amount,
      currency:    "INR",
      name:        "Fun Travels",
      description: "Bus Ticket Booking",
      order_id:    order.id,

      prefill: {
        name:    passenger,
        email:   email,
        contact: phone
      },

      theme: { color: "#2563eb" },

      // Called after successful payment
      handler: async function (response) {
        try {
          console.log("Payment success:", response);

          const res2 = await fetch(`${API_BASE}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passenger,
              phone,
              email,
              ...bookingDraft,
              paymentMethod:   selectedPayment,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              total:      bookingDraft.total,
              grandTotal: bookingDraft.total
            })
          });

          const data = await res2.json();
          if (!res2.ok) throw new Error(data.message || "Booking save failed");

          localStorage.setItem("ft_last_paid", JSON.stringify({
          ...data.booking,
          qr: data.qr // 👈 ADD THIS
          }));
          localStorage.removeItem("ft_booking_draft");

          window.location.href = "success.html";

        } catch (err) {
          console.error("Booking save error:", err);
          alert("Payment was successful but booking save failed: " + err.message);
          setLoadingState(false);
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {
      console.error("Payment failed:", response.error);
      alert("Payment failed: " + response.error.description);
      setLoadingState(false);
    });

    rzp.open();

  } catch (err) {
    console.error("Payment flow error:", err);
    alert(err.message || "Something went wrong. Please try again.");
    setLoadingState(false);
  }
});

// ── Inline validation ────────────────────────────────────
phoneInput.addEventListener("blur", () => {
  if (phoneInput.value && !validatePhone(phoneInput.value)) {
    phoneInput.style.borderColor = "red";
  }
});
phoneInput.addEventListener("input", () => {
  phoneInput.style.borderColor = "";
});

emailInput.addEventListener("blur", () => {
  if (emailInput.value && !validateEmail(emailInput.value)) {
    emailInput.style.borderColor = "red";
  }
});
emailInput.addEventListener("input", () => {
  emailInput.style.borderColor = "";
});