const API_BASE = "http://127.0.0.1:5000/api";

const container = document.getElementById("resultsContainer");

// ✅ Get search data
const search = (() => {
  try { return JSON.parse(localStorage.getItem("ft_search") || "{}"); }
  catch { return {}; }
})();

// ✅ Get user
const user = (() => {
  try { return JSON.parse(localStorage.getItem("ft_user") || "{}"); }
  catch { return {}; }
})();

// 🔐 Redirect if not logged in
if (!user.isLoggedIn) {
  localStorage.setItem("ft_redirect_after_login", "results.html");
  location.href = "login.html";
}

// ✅ Generate seats
function makeSeats() {
  const seats = [];
  for (let i = 1; i <= 20; i++) {
    seats.push(i < 10 ? `L0${i}` : `L${i}`);
  }
  return seats;
}

// ✅ Skeleton loader
function skeletonCards() {
  return Array.from({ length: 3 }).map(() => `
    <div class="skeleton">
      <div class="sk-line big"></div>
      <div class="sk-line mid"></div>
      <div class="sk-line small"></div>
    </div>
  `).join("");
}

// ⭐ Generate premium rating
function generateRating(bus) {
  const rating = bus.rating || 4.2;
  const full = Math.floor(rating);

  return `
    <div class="rating-badge premium-rating">
      <span class="rating-stars">
        ${"★".repeat(full)}${"☆".repeat(5 - full)}
      </span>
      <span class="rating-value">${rating}</span>
      <span class="verified">✔ Verified</span>
    </div>
  `;
}

// ✅ Render buses
function renderBuses(buses) {
  if (!container) return;

  if (!buses.length) {
    container.innerHTML = `
      <div class="empty-box">
        <h3>No buses found</h3>
        <p>Try Chennai → Bangalore or Hyderabad → Chennai.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = buses.map((bus) => {
    const seats = makeSeats();
    const bookedSeats = bus.bookedSeats || [];

    return `
      <div class="result-card">

        <!-- TOP -->
        <div class="result-top">
          <div>
            <h3>${bus.name}</h3>

            ${generateRating(bus)}

            <div class="badge">${bus.busType}</div>
          </div>

          <div class="price-big">₹${bus.price}</div>
        </div>

        <!-- META -->
        <div class="result-meta">
          <div class="meta-box"><span>Bus No</span><strong>${bus.busNumber}</strong></div>
          <div class="meta-box"><span>Departure</span><strong>${bus.departureTime}</strong></div>
          <div class="meta-box"><span>Arrival</span><strong>${bus.arrivalTime}</strong></div>
          <div class="meta-box"><span>Duration</span><strong>${bus.duration}</strong></div>
        </div>

        <!-- SEATS -->
        <div class="seat-map-wrap">
          <div class="seat-map-head">
            <strong>Select Seats</strong>
            <span class="badge">Booked seats disabled</span>
          </div>

          <div class="seat-grid" data-bus="${bus._id}">
            ${seats.map((seat) => `
              <button
                type="button"
                class="seat ${bookedSeats.includes(seat) ? "booked" : ""}"
                data-bus="${bus._id}"
                data-seat="${seat}"
                ${bookedSeats.includes(seat) ? "disabled" : ""}
              >
                ${seat}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="result-actions">
          <div>
            <div><strong>Boarding:</strong> Main Bus Stand</div>
            <div><strong>Dropping:</strong> City Center</div>
          </div>

          <button class="btn btn-primary continue-btn"
            data-id="${bus._id}"
            data-name="${bus.name}"
            data-type="${bus.busType}"
            data-price="${bus.price}"
          >
            Continue
          </button>
        </div>

      </div>
    `;
  }).join("");

  // ✅ Seat selection
  document.querySelectorAll(".seat:not(.booked)").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
    });
  });

  // ✅ Continue button
  document.querySelectorAll(".continue-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const busId = btn.dataset.id;

      const selectedSeats = [
        ...document.querySelectorAll(`.seat.selected[data-bus="${busId}"]`)
      ].map((s) => s.dataset.seat);

      if (!selectedSeats.length) {
        alert("Select at least one seat");
        return;
      }

      const bookingDraft = {
        busId,
        from: search.from,
        to: search.to,
        date: search.date,
        operator: btn.dataset.name,
        type: btn.dataset.type,
        seats: selectedSeats,
        pricePerSeat: Number(btn.dataset.price),
        total: Number(btn.dataset.price) * selectedSeats.length,
        boarding: "Main Bus Stand",
        dropping: "City Center"
      };

      localStorage.setItem("ft_booking_draft", JSON.stringify(bookingDraft));
      location.href = "payment.html";
    });
  });
}

// ✅ Load results
async function loadResults() {
  if (!container) return;

  if (!search.from || !search.to || !search.date) {
    container.innerHTML = `<div class="error-box">Search missing</div>`;
    return;
  }

  container.innerHTML = skeletonCards();

  try {
    const res = await fetch(`${API_BASE}/buses`);
    const allBuses = await res.json();

    const filtered = allBuses.filter((bus) =>
      bus.from.toLowerCase() === search.from.toLowerCase() &&
      bus.to.toLowerCase() === search.to.toLowerCase()
    );

    renderBuses(filtered);

  } catch (err) {
    container.innerHTML = `<div class="error-box">Backend error</div>`;
  }
}

// 🚀 Start
loadResults();