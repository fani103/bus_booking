const API_BASE = "http://127.0.0.1:5000/api";

function generateStars(rating = 4) {
  let stars = "";
  const full = Math.floor(Number(rating) || 4);

  for (let i = 1; i <= 5; i++) {
    stars += i <= full ? "★" : "☆";
  }

  return `
    <div class="rating">
      <span class="stars">${stars}</span>
      <span class="rating-num">${(Number(rating) || 4).toFixed(1)}</span>
    </div>
  `;
}

// Safe user parsing
let user = {};
try {
  user = JSON.parse(localStorage.getItem("ft_user") || "{}");
} catch (e) {
  user = {};
}

const phoneInput = document.getElementById("bookingPhone");
const container = document.getElementById("bookingsContainer");
const loadBtn = document.getElementById("loadBookingsBtn");

if (phoneInput && user.phone) {
  phoneInput.value = user.phone;
}

function skeletonBookings() {
  return Array.from({ length: 3 }).map(() => `
    <div class="skeleton">
      <div class="sk-line big"></div>
      <div class="sk-line mid"></div>
      <div class="sk-line small"></div>
      <div class="sk-line"></div>
      <div class="sk-line"></div>
    </div>
  `).join("");
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderBookings(bookings = []) {
  if (!container) return;

  if (!bookings.length) {
    container.innerHTML = `
      <div class="empty-box">
        <div style="font-size:48px;margin-bottom:12px">🎫</div>
        <h3>No bookings found</h3>
        <p style="color:var(--text-light);margin-top:8px">
          Looks like you haven't booked any trips yet, or the phone number doesn't match.
        </p>
        <a href="index.html" class="btn btn-primary" style="display:inline-flex;margin-top:18px">
          Book Your First Trip →
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map(booking => {
    const rating = Number(booking.rating) || 4;

    return `
      <div class="booking-card" style="margin-bottom:16px">
        <div class="result-top">
          <div>
            <h3>${escHtml(booking.operator || "N/A")}</h3>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">
              <span class="verified">✔ Verified</span>
              ${generateStars(rating)}
              ${rating >= 4.5 ? `<span class="top-rated">🔥 Top Rated</span>` : ""}
            </div>

            <div class="badge" style="margin-top:8px;display:inline-block;${
              booking.status === "CONFIRMED"
                ? "background:#dcfce7;color:#16a34a;"
                : "background:#fee2e2;color:#dc2626;"
            }">
              ${escHtml(booking.status || "UNKNOWN")}
            </div>
          </div>

          <div class="price-big">₹${booking.grandTotal || 0}</div>
        </div>

        <div class="ticket-grid" style="margin-top:14px">
          <div class="ticket-item">
            <span>Booking ID</span>
            <strong>${escHtml(booking.bookingId || "-")}</strong>
          </div>

          <div class="ticket-item">
            <span>Route</span>
            <strong>${escHtml(booking.from || "-")} → ${escHtml(booking.to || "-")}</strong>
          </div>

          <div class="ticket-item">
            <span>Date</span>
            <strong>${escHtml(booking.date || "-")}</strong>
          </div>

          <div class="ticket-item">
            <span>Seats</span>
            <strong>${escHtml((booking.seats || []).join(", "))}</strong>
          </div>

          <div class="ticket-item">
            <span>Passenger</span>
            <strong>${escHtml(booking.passenger || "-")}</strong>
          </div>

          <div class="ticket-item">
            <span>Payment</span>
            <strong>${escHtml(booking.paymentMethod || "-")}</strong>
          </div>
        </div>

        ${
          booking.status === "CONFIRMED"
            ? `
              <div class="actions">
                <button class="btn btn-dark cancel-btn" data-id="${booking._id}">
                  Cancel Booking
                </button>
              </div>
            `
            : `
              <div style="margin-top:12px;padding:10px 14px;background:#fee2e2;border-radius:12px;color:#dc2626;font-weight:700;font-size:13px">
                ✗ This booking has been cancelled
              </div>
            `
        }
      </div>
    `;
  }).join("");

  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const ok = confirm("Are you sure you want to cancel this booking?");
      if (!ok) return;

      btn.textContent = "Cancelling...";
      btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/bookings/${btn.dataset.id}/cancel`, {
          method: "PUT",
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to cancel booking");
          btn.textContent = "Cancel Booking";
          btn.disabled = false;
          return;
        }

        loadBookings();
      } catch (err) {
        alert("Server error while cancelling booking. Please try again.");
        btn.textContent = "Cancel Booking";
        btn.disabled = false;
      }
    });
  });
}

async function loadBookings() {
  if (!container) return;

  const phone = phoneInput ? phoneInput.value.trim() : "";

  if (!phone) {
    container.innerHTML = `
      <div class="empty-box">
        <div style="font-size:48px;margin-bottom:12px">📱</div>
        <h3>Enter your phone number</h3>
        <p style="color:var(--text-light);margin-top:8px">
          Type your registered mobile number and tap "Load Bookings"
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = skeletonBookings();

  try {
    const res = await fetch(`${API_BASE}/bookings?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `
        <div class="error-box">
          <strong>Error:</strong> ${escHtml(data.message || "Failed to load bookings")}
        </div>
      `;
      return;
    }

    renderBookings(Array.isArray(data) ? data : []);
  } catch (err) {
    container.innerHTML = `
      <div class="error-box">
        <strong>Connection failed.</strong><br>
        Make sure your backend server is running on port 5000.
      </div>
    `;
  }
}

if (loadBtn) {
  loadBtn.addEventListener("click", loadBookings);
}

if (phoneInput) {
  phoneInput.addEventListener("keydown", e => {
    if (e.key === "Enter") loadBookings();
  });
}

if (user.phone) {
  loadBookings();
} else if (container) {
  container.innerHTML = `
    <div class="empty-box">
      <div style="font-size:48px;margin-bottom:12px">📱</div>
      <h3>Enter your phone number</h3>
      <p style="color:var(--text-light);margin-top:8px">
        Type your registered mobile number above and tap "Load Bookings"
      </p>
    </div>
  `;
}