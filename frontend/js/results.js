const API_BASE = "https://sprinkler-daughter-exalted.ngrok-free.dev/api";

const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true"
};

const container = document.getElementById("resultsContainer");

const search = (() => {
  try { return JSON.parse(localStorage.getItem("ft_search") || "{}"); }
  catch { return {}; }
})();

const user = (() => {
  try { return JSON.parse(localStorage.getItem("ft_user") || "{}"); }
  catch { return {}; }
})();

if (!user.isLoggedIn) {
  localStorage.setItem("ft_redirect_after_login", "results.html");
  location.href = "login.html";
}

function skeletonCards() {
  return Array.from({ length: 3 }).map(() => `
    <div class="skeleton">
      <div class="sk-line big"></div>
      <div class="sk-line mid"></div>
      <div class="sk-line small"></div>
    </div>
  `).join("");
}

function generateRating(bus) {
  const rating = Number(bus.rating) || 4.2;
  const full = Math.floor(rating);
  return `
    <div class="rating-badge premium-rating">
      <span class="rating-stars">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>
      <span class="rating-value">${rating}</span>
      <span class="verified">✔ Verified</span>
    </div>
  `;
}

function renderBuses(buses) {
  if (!container) return;

  if (!buses.length) {
    container.innerHTML = `
      <div class="empty-box">
        <h3>No buses found</h3>
        <p>Try Chennai → Bangalore or Hyderabad → Chennai.</p>
        <p style="margin-top:8px;color:#666">
          Searched: <strong>${search.from} → ${search.to}</strong> on <strong>${search.date}</strong>
        </p>
        <button onclick="seedAndReload()" class="btn btn-primary" style="margin-top:16px">
          Load Sample Buses
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = buses.map((bus) => {
    const allSeats = Array.isArray(bus.seats) && bus.seats.length ? bus.seats : [];
    const bookedSeats = Array.isArray(bus.bookedSeats) ? bus.bookedSeats : [];

    return `
      <div class="result-card">
        <div class="result-top">
          <div>
            <h3>${bus.name}</h3>
            ${generateRating(bus)}
            <div class="badge">${bus.busType}</div>
          </div>
          <div class="price-big">₹${bus.price}</div>
        </div>

        <div class="result-meta">
          <div class="meta-box"><span>Bus No</span><strong>${bus.busNumber}</strong></div>
          <div class="meta-box"><span>Departure</span><strong>${bus.departureTime}</strong></div>
          <div class="meta-box"><span>Arrival</span><strong>${bus.arrivalTime}</strong></div>
          <div class="meta-box"><span>Duration</span><strong>${bus.duration}</strong></div>
        </div>

        <div class="seat-map-wrap">
          <div class="seat-map-head">
            <strong>Select Seats</strong>
            <div class="seat-legend">
              <span class="legend-item"><span class="legend-box available"></span> Available</span>
              <span class="legend-item"><span class="legend-box selected"></span> Selected</span>
              <span class="legend-item"><span class="legend-box booked"></span> Booked</span>
            </div>
          </div>

          <div class="seat-grid" data-bus="${bus._id}">
            ${allSeats.map((seat) => {
              const isBooked = bookedSeats.includes(seat);
              return `
                <button
                  type="button"
                  class="seat ${isBooked ? "booked" : "available"}"
                  data-bus="${bus._id}"
                  data-seat="${seat}"
                  ${isBooked ? "disabled" : ""}
                  title="${isBooked ? "Already booked" : "Seat " + seat}"
                >
                  ${seat}
                </button>
              `;
            }).join("")}
          </div>

          <div class="seat-summary" id="summary-${bus._id}">No seats selected</div>
        </div>

        <div class="result-actions">
          <div>
            <div><strong>Boarding:</strong> Main Bus Stand</div>
            <div><strong>Dropping:</strong> City Center</div>
          </div>
          <button
            class="btn btn-primary continue-btn"
            data-id="${bus._id}"
            data-busnumber="${bus.busNumber}"
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

  document.querySelectorAll(".seat.available").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
      btn.classList.toggle("available");

      const busId = btn.dataset.bus;
      const selected = [...document.querySelectorAll(`.seat.selected[data-bus="${busId}"]`)]
        .map((s) => s.dataset.seat);

      const summary = document.getElementById(`summary-${busId}`);
      if (summary) {
        summary.textContent = selected.length
          ? `Selected: ${selected.join(", ")} (${selected.length} seat${selected.length > 1 ? "s" : ""})`
          : "No seats selected";
      }
    });
  });

  document.querySelectorAll(".continue-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const busId = btn.dataset.id;
      const selectedSeats = [...document.querySelectorAll(`.seat.selected[data-bus="${busId}"]`)]
        .map((s) => s.dataset.seat);

      if (!selectedSeats.length) {
        alert("Please select at least one seat");
        return;
      }

      const bookingDraft = {
        busId,
        busNumber: btn.dataset.busnumber,
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

window.seedAndReload = async function () {
  try {
    const res = await fetch(
      `${API_BASE}/buses/seed?secret=funtravels2026`,
      { method: "GET", headers: HEADERS }
    );
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Seed failed");
      return;
    }

    alert(`Seeded ${data.count} buses! Reloading...`);
    loadResults();
  } catch (err) {
    alert("Seed failed: " + err.message);
  }
};

async function loadResults() {
  if (!container) return;

  if (!search.from || !search.to || !search.date) {
    container.innerHTML = `
      <div class="error-box">
        No search data. <a href="index.html">Go back and search</a>
      </div>
    `;
    return;
  }

  container.innerHTML = skeletonCards();

  try {
    const res = await fetch(
      `${API_BASE}/buses?from=${encodeURIComponent(search.from)}&to=${encodeURIComponent(search.to)}&date=${encodeURIComponent(search.date)}`,
      { method: "GET", headers: HEADERS }
    );

    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const buses = await res.json();

    if (!Array.isArray(buses)) throw new Error("Invalid buses response");

    renderBuses(buses);
  } catch (err) {
    container.innerHTML = `
      <div class="error-box">
        <strong>Error:</strong> ${err.message}<br><br>
        <button onclick="loadResults()" class="btn btn-primary">Retry</button>
      </div>
    `;
  }
}

loadResults();