const API_BASE = "https://sprinkler-daughter-exalted.ngrok-free.dev/api";

const DEMO_MODE = true;

const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true"
};

const loginForm  = document.getElementById("loginForm");
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

let generatedOtp = "";
let otpExpiresAt = 0;
let timer = null;

let trip = {};

try {
  trip = JSON.parse(localStorage.getItem("ft_search") || "{}");
} catch {}

if (tripText) {
  tripText.textContent =
    (trip.from && trip.to && trip.date)
      ? `${trip.from} → ${trip.to} | ${trip.date}`
      : "No trip selected yet";
}

let existingUser = {};

try {
  existingUser = JSON.parse(localStorage.getItem("ft_user") || "{}");
} catch {}

if (existingUser.isLoggedIn) {
  const redirect =
    localStorage.getItem("ft_redirect_after_login")
    || "results.html";

  location.href = redirect;
}

function setError(msg = "") {
  if (errorMsg) errorMsg.textContent = msg;
}

function setStatus(msg = "") {
  if (statusMsg) statusMsg.textContent = msg;
}

[nameInput, phoneInput, otpInput].forEach(input => {
  input?.addEventListener("input", () => {
    setError("");
  });
});

function startTimer(seconds) {

  clearInterval(timer);

  otpExpiresAt = Date.now() + seconds * 1000;

  function updateTimer() {

    const remaining = Math.max(
      0,
      Math.floor((otpExpiresAt - Date.now()) / 1000)
    );

    if (countdown) {
      countdown.textContent =
        remaining > 0
          ? `OTP valid for ${remaining}s`
          : "OTP expired. Please resend.";
    }

    if (remaining === 0) {

      clearInterval(timer);

      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Resend OTP";
    }
  }

  updateTimer();

  timer = setInterval(updateTimer, 1000);
}

sendOtpBtn?.addEventListener("click", () => {

  setError("");
  setStatus("");

  const name = nameInput?.value.trim() || "";
  const phone = phoneInput?.value.trim() || "";

  if (name.length < 2) {
    setError("Please enter your name");
    nameInput.focus();
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    setError("Please enter valid mobile number");
    phoneInput.focus();
    return;
  }

  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = "Sending...";

  generatedOtp = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  otpBox.classList.add("show");

  otpInput.focus();

  setStatus("OTP sent successfully ✓");

  sendOtpBtn.textContent = "Resend OTP";

  startTimer(60);

  if (DEMO_MODE) {
    alert("Demo OTP: " + generatedOtp);
  }
});

async function handleVerify(e) {

  e.preventDefault();

  setError("");

  const name =
    nameInput?.value.trim() || "";

  const phone =
    phoneInput?.value.trim() || "";

  const enteredOtp =
    otpInput?.value.trim() || "";

  if (name.length < 2) {
    setError("Please enter your name");
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    setError("Please enter valid mobile number");
    return;
  }

  if (!otpBox.classList.contains("show")) {
    setError("Please send OTP first");
    return;
  }

  if (!generatedOtp) {
    setError("Please send OTP first");
    return;
  }

  if (Date.now() > otpExpiresAt) {
    setError("OTP expired. Please resend.");
    return;
  }

  if (enteredOtp !== generatedOtp) {
    setError("Incorrect OTP");
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying...";

  try {

    const res = await fetch(`${API_BASE}/users/login`, {
      method: "POST",
      headers: HEADERS,

      body: JSON.stringify({
        name,
        phone,
        email: ""
      })
    });

    let data = {};

    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {

      setError(
        data.message || "Login failed"
      );

      verifyBtn.disabled = false;
      verifyBtn.textContent =
        "Verify OTP & Continue";

      return;
    }

    localStorage.setItem(
      "ft_user",
      JSON.stringify({
        _id: data.user?._id || "",
        name: data.user?.name || name,
        phone: data.user?.phone || phone,
        email: data.user?.email || "",
        isLoggedIn: true
      })
    );

    generatedOtp = "";

    clearInterval(timer);

    const redirect =
      localStorage.getItem("ft_redirect_after_login")
      || "results.html";

    localStorage.removeItem(
      "ft_redirect_after_login"
    );

    location.href = redirect;

  } catch (err) {

    console.error(err);

    setError("Unable to connect to server");

    verifyBtn.disabled = false;

    verifyBtn.textContent =
      "Verify OTP & Continue";
  }
}

loginForm?.addEventListener("submit", handleVerify);

const adminRedirectBtn =
  document.getElementById("adminRedirectBtn");

if (adminRedirectBtn) {

  adminRedirectBtn.addEventListener("click", () => {

    const adminPassword =
      prompt("Enter admin password");

    if (adminPassword === "admin123") {
      window.location.href = "js/admin.html";
    } else {
      alert("Access denied");
    }
  });
}

window.addEventListener("beforeunload", () => {
  clearInterval(timer);
});