const API_BASE = "http://localhost:5000/api";
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

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

if (dateInput) {
  const today = new Date();
  dateInput.value = formatDate(today);
  dateInput.min = formatDate(today);
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ── Scroll helpers ──────────────────────────────────────────────────────────
function scrollToHome(e) {
  if (e) e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setActiveNav("home");
}

function scrollToRoutes(e) {
  if (e) e.preventDefault();
  const el = document.getElementById("routes");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  } else {
    // If not on index page, navigate there with hash
    location.href = "index.html#routes";
  }
  setActiveNav("routes");
}

function scrollToContact(e) {
  if (e) e.preventDefault();
  const el = document.getElementById("contact");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  } else {
    location.href = "index.html#contact";
  }
  setActiveNav("contact");
}

// Make globally available (used inline in HTML)
window.scrollToHome = scrollToHome;
window.scrollToRoutes = scrollToRoutes;
window.scrollToContact = scrollToContact;

// ── Active nav highlight ───────────────────────────────────────────────────
function setActiveNav(key) {
  document.querySelectorAll(".nav a").forEach(a => a.classList.remove("active"));
  const map = { home: 0, routes: 1, contact: 2 };
  const links = document.querySelectorAll(".nav a");
  if (map[key] !== undefined && links[map[key]]) {
    links[map[key]].classList.add("active");
  }
}

// Handle hash on page load (e.g. index.html#routes)
window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash === "#routes") {
    setTimeout(() => {
      document.getElementById("routes")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  } else if (hash === "#contact") {
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }
});

// ── Swap cities ────────────────────────────────────────────────────────────
swapBtn?.addEventListener("click", () => {
  if (!fromInput || !toInput) return;
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
  closeSuggestions();
});

// ── City autocomplete ──────────────────────────────────────────────────────
function renderSuggestions(inputEl, boxEl) {
  const value = inputEl.value.trim().toLowerCase();
  const filtered = cities.filter(city => city.toLowerCase().includes(value));

  if (!value || !filtered.length) {
    boxEl.classList.remove("show");
    boxEl.innerHTML = "";
    return;
  }

  boxEl.innerHTML = filtered
    .map(city => `<div class="suggestion-item">${city}</div>`)
    .join("");
  boxEl.classList.add("show");

  boxEl.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      inputEl.value = item.textContent;
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

// ── Search form submit ─────────────────────────────────────────────────────
searchForm?.addEventListener("submit", e => {
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

  localStorage.setItem("ft_search", JSON.stringify({ from, to, date }));
  localStorage.setItem("ft_redirect_after_login", "results.html");

  // If already logged in, skip login page
  let user = {};
  try { user = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}
  location.href = user.isLoggedIn ? "results.html" : "login.html";
});

// ── Popular route quick-book ───────────────────────────────────────────────
function bookRoute(from, to) {
  const date = (dateInput?.value) || formatDate(new Date());
  localStorage.setItem("ft_search", JSON.stringify({ from, to, date }));
  localStorage.setItem("ft_redirect_after_login", "results.html");

  let user = {};
  try { user = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}
  location.href = user.isLoggedIn ? "results.html" : "login.html";
}
window.bookRoute = bookRoute;

// ── Misc button handlers ───────────────────────────────────────────────────
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

// ── Bottom fixed nav ───────────────────────────────────────────────────────
document.querySelectorAll(".nav-fixed-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-fixed-item").forEach(b => b.classList.remove("active"));
    item.classList.add("active");

    const type = item.dataset.nav;
    if (type === "home")     scrollToHome();
    if (type === "bookings") location.href = "mybookings.html";
    if (type === "help")     scrollToContact();
    if (type === "account")  location.href = "myaccount.html";
  });
});

// ── Update nav to show account icon when logged in ─────────────────────────
(function updateHeaderNav() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}

  // Add Account link to header nav if logged in and it doesn't exist
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

// ── Backend warmup ─────────────────────────────────────────────────────────
async function warmupBackend() {
  try { await fetch(`${API_BASE}/`); } catch { /* ignore */ }
}
warmupBackend();