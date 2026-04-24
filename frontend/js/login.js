const API_BASE = "http://127.0.0.1:5000/api";

// ── DOM refs (match login.html exactly) ───────────────────────────────────
const nameInput  = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const otpInput   = document.getElementById("otpInput");
const otpBox     = document.getElementById("otpBox");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyBtn  = document.getElementById("verifyBtn");
const statusMsg  = document.getElementById("statusMsg");
const countdown  = document.getElementById("countdown");
const errorMsg   = document.getElementById("errorMsg");
const tripText   = document.getElementById("tripText");

// ── State ──────────────────────────────────────────────────────────────────
let generatedOtp = "";
let otpExpiresAt = 0;
let timer        = null;

// ── Trip preview ───────────────────────────────────────────────────────────
let trip = {};
try { trip = JSON.parse(localStorage.getItem("ft_search") || "{}"); } catch {}

if (tripText) {
  tripText.textContent = (trip.from && trip.to && trip.date)
    ? `${trip.from} → ${trip.to} | ${trip.date}`
    : "No trip selected yet";
}

// ── Redirect if already logged in ─────────────────────────────────────────
let existingUser = {};
try { existingUser = JSON.parse(localStorage.getItem("ft_user") || "{}"); } catch {}
if (existingUser.isLoggedIn) {
  const redirect = localStorage.getItem("ft_redirect_after_login") || "results.html";
  location.href = redirect;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function setError(msg) {
  if (errorMsg) errorMsg.textContent = msg || "";
}

function startTimer(seconds) {
  clearInterval(timer);
  otpExpiresAt = Date.now() + seconds * 1000;

  timer = setInterval(() => {
    const remaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
    if (countdown) {
      countdown.textContent = remaining > 0
        ? `OTP valid for ${remaining}s`
        : "OTP expired. Please resend.";
    }
    if (remaining === 0) clearInterval(timer);
  }, 1000);
}

// ── Send OTP ───────────────────────────────────────────────────────────────
sendOtpBtn?.addEventListener("click", () => {
  setError("");
  const name  = nameInput?.value.trim()  || "";
  const phone = phoneInput?.value.trim() || "";

  if (name.length < 2) {
    setError("Please enter your name (at least 2 characters)");
    nameInput?.focus();
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    setError("Please enter a valid 10-digit phone number");
    phoneInput?.focus();
    return;
  }

  // Generate 6-digit OTP
  generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

  // Show OTP box
  if (otpBox)   otpBox.classList.add("show");
  if (statusMsg) statusMsg.textContent = "OTP sent successfully ✓";
  if (sendOtpBtn) sendOtpBtn.textContent = "Resend OTP";

  startTimer(60);

  // Demo: show OTP in alert (replace with real SMS API in production)
  alert("Demo OTP: " + generatedOtp);
});

// ── Verify OTP & Login ─────────────────────────────────────────────────────
async function handleVerify(e) {
  if (e) e.preventDefault();
  setError("");

  const name        = nameInput?.value.trim()  || "";
  const phone       = phoneInput?.value.trim() || "";
  const enteredOtp  = otpInput?.value.trim()   || "";

  if (name.length < 2) { setError("Please enter your name"); return; }
  if (!/^\d{10}$/.test(phone)) { setError("Please enter a valid 10-digit phone number"); return; }
  if (!generatedOtp)   { setError("Please send OTP first"); return; }
  if (Date.now() > otpExpiresAt) { setError("OTP expired. Please resend."); return; }
  if (enteredOtp !== generatedOtp) { setError("Incorrect OTP. Please try again."); return; }

  // Disable button during API call
  if (verifyBtn) { verifyBtn.textContent = "Verifying..."; verifyBtn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, phone, email: "" })
    });

    let data = {};
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      setError(data.message || "Login failed. Please try again.");
      if (verifyBtn) { verifyBtn.textContent = "Verify OTP & Continue"; verifyBtn.disabled = false; }
      return;
    }

    // ✅ Save user to localStorage
    localStorage.setItem("ft_user", JSON.stringify({
      _id:       data.user?._id   || "",
      name:      data.user?.name  || name,
      phone:     data.user?.phone || phone,
      email:     data.user?.email || "",
      isLoggedIn: true
    }));

    // Clear OTP state
    generatedOtp = "";
    clearInterval(timer);

    // Redirect
    const redirect = localStorage.getItem("ft_redirect_after_login") || "results.html";
    localStorage.removeItem("ft_redirect_after_login");
    location.href = redirect;

  } catch (err) {
    setError("Connection failed: " + err.message + ". Is the backend running?");
    if (verifyBtn) { verifyBtn.textContent = "Verify OTP & Continue"; verifyBtn.disabled = false; }
  }
}

// Attach to both form submit and button click
document.getElementById("loginForm")?.addEventListener("submit", handleVerify);
verifyBtn?.addEventListener("click", handleVerify);