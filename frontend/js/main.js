const API_BASE = "https://sprinkler-daughter-exalted.ngrok-free.dev/api";

const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true"
};

const cities = [
  "Chennai", "Bangalore", "Hyderabad", "Nandyal", "Kadapa",
  "Rajahmundry", "Vijayawada", "Visakhapatnam", "Tirupati",
  "Coimbatore", "Mumbai"
];

const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");
const fromSuggestions = document.getElementById("fromSuggestions");
const toSuggestions = document.getElementById("toSuggestions");
const swapBtn = document.getElementById("swapBtn");
const dateInput = document.getElementById("dateInput");
const searchForm = document.getElementById("searchForm");
const toast = document.getElementById("toast");

// ── Date Setup ─────────────────────────────────────────
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

if (dateInput) {
  const today = new Date();
  dateInput.value = formatDate(today);
  dateInput.min = formatDate(today);
}

// ── Toast ──────────────────────────────────────────────
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ── Scroll Helpers ─────────────────────────────────────
function scrollToHome(e) {
  if (e) e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setActiveNav("home");
}

function scrollToRoutes(e) {
  if (e) e.preventDefault();
  const el = document.getElementById("routes");
  if (el) el.scrollIntoView({ behavior: "smooth" });
  else location.href = "index.html#routes";
  setActiveNav("routes");
}

function scrollToContact(e) {
  if (e) e.preventDefault();
  const el = document.getElementById("contact");
  if (el) el.scrollIntoView({ behavior: "smooth" });
  else location.href = "index.html#contact";
  setActiveNav("contact");
}

window.scrollToHome = scrollToHome;
window.scrollToRoutes = scrollToRoutes;
window.scrollToContact = scrollToContact;

// ── Active Navigation ──────────────────────────────────
function setActiveNav(key) {
  document.querySelectorAll(".nav a").forEach(a => a.classList.remove("active"));
  const map = { home: 0, routes: 1, contact: 2 };
  const links = document.querySelectorAll(".nav a");
  if (map[key] !== undefined && links[map[key]]) {
    links[map[key]].classList.add("active");
  }
}

// ── Handle Hash Scroll ─────────────────────────────────
window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash === "#routes") {
    setTimeout(() => document.getElementById("routes")?.scrollIntoView({ behavior: "smooth" }), 200);
  }
  if (hash === "#contact") {
    setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 200);
  }
});

// ── Swap Cities ────────────────────────────────────────
swapBtn?.addEventListener("click", () => {
  if (!fromInput || !toInput) return;
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
  closeSuggestions();
});

// ── Suggestions ────────────────────────────────────────
function renderSuggestions(inputEl, boxEl) {
  const value = inputEl.value.trim().toLowerCase();
  const filtered = cities.filter(city => city.toLowerCase().includes(value));

  if (!value || !filtered.length) {
    boxEl.classList.remove("show");
    boxEl.innerHTML = "";
    return;
  }

  boxEl.innerHTML = filtered.map(city => `<div class="suggestion-item">${city}</div>`).join("");
  boxEl.classList.add("show");

  boxEl.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      inputEl.value = item.textContent.trim();
      boxEl.classList.remove("show");
    });
  });
}

function closeSuggestions() {
  fromSuggestions?.classList.remove("show");
  toSuggestions?.classList.remove("show");
}

fromInput?.addEventListener("input", () => renderSuggestions(fromInput, fromSuggestions));
toInput?.addEventListener("input", () => renderSuggestions(toInput, toSuggestions));

document.addEventListener("click", e => {
  if (!e.target.closest(".field")) closeSuggestions();
});

// ── Search Submit ──────────────────────────────────────
searchForm?.addEventListener("submit", async e => {
  e.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const date = dateInput.value;

  if (!from || !to || !date) {
    showToast("Please fill From, To and Date");
    return;
  }

  if (from.toLowerCase() === to.toLowerCase()) {
    showToast("From and To cannot be same");
    return;
  }

  try {
    const url = `${API_BASE}/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`;
    console.log("Fetching:", url);

    const res = await fetch(url, { method: "GET", headers: HEADERS });

    if (!res.ok) throw new Error("Failed to fetch buses");

    const buses = await res.json();
    console.log("Buses:", buses);

    localStorage.setItem("ft_search", JSON.stringify({ from, to, date }));
    localStorage.setItem("ft_buses", JSON.stringify(buses));
    localStorage.setItem("ft_redirect_after_login", "results.html");

    let user = {};
    try { user = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}

    location.href = user.isLoggedIn ? "results.html" : "login.html";

  } catch (error) {
    console.error(error);
    showToast("Failed to connect backend");
  }
});

// ── Popular Route Booking ──────────────────────────────
function bookRoute(from, to) {
  const date = dateInput?.value || formatDate(new Date());
  localStorage.setItem("ft_search", JSON.stringify({ from, to, date }));
  localStorage.setItem("ft_redirect_after_login", "results.html");

  let user = {};
  try { user = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}

  location.href = user.isLoggedIn ? "results.html" : "login.html";
}

window.bookRoute = bookRoute;

// ── Buttons ────────────────────────────────────────────
document.getElementById("knowMoreBtn")?.addEventListener("click", () => {
  showToast("Women-only seats available on select buses");
});

document.getElementById("trainFestBtn")?.addEventListener("click", () => {
  showToast("Train booking coming soon!");
});

document.getElementById("bookTripBtn")?.addEventListener("click", () => {
  scrollToHome();
  setTimeout(() => fromInput?.focus(), 300);
});

document.getElementById("startBookingBtn")?.addEventListener("click", () => {
  scrollToHome();
  setTimeout(() => fromInput?.focus(), 300);
});

// ── Bottom Fixed Navigation ────────────────────────────
document.querySelectorAll(".nav-fixed-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-fixed-item").forEach(btn => btn.classList.remove("active"));
    item.classList.add("active");

    const type = item.dataset.nav;
    if (type === "home") scrollToHome();
    if (type === "bookings") location.href = "mybookings.html";
    if (type === "help") scrollToContact();
    if (type === "account") location.href = "myaccount.html";
  });
});

// ── Header Account Link ────────────────────────────────
(function updateHeaderNav() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}

  const nav = document.querySelector(".nav");
  if (nav && user.isLoggedIn) {
    const exists = [...nav.querySelectorAll("a")].some(a => a.href.includes("myaccount"));
    if (!exists) {
      const a = document.createElement("a");
      a.href = "myaccount.html";
      a.textContent = "👤 " + (user.name || "Account");
      nav.appendChild(a);
    }
  }
})();