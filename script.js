/*******************************
 * KONFIGURASI
 *******************************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbzO55YCPFDNd9WQPykDCt3NqL4gPjLsZJ-kk1crNiHmWOKxQCKaUa_VLKBmvUrtx8L6/exec";

let currentRole = "guest";

/*******************************
 * ELEMENT DOM
 *******************************/
const loginScreen = document.getElementById("loginScreen");
const mainScreen = document.getElementById("mainScreen");
const adminLoginForm = document.getElementById("adminLoginForm");
const userRoleText = document.getElementById("userRole");

const guestBtn = document.getElementById("guestBtn");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const loginBtn = document.getElementById("loginBtn");
const cancelLoginBtn = document.getElementById("cancelLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const passwordInput = document.getElementById("password");

/*******************************
 * LOGIN LOGIC
 *******************************/
guestBtn.onclick = () => {
  currentRole = "guest";
  enterApp();
};

adminLoginBtn.onclick = () => {
  adminLoginForm.classList.remove("hidden");
};

cancelLoginBtn.onclick = () => {
  adminLoginForm.classList.add("hidden");
  passwordInput.value = "";
};

loginBtn.onclick = async () => {
  const password = passwordInput.value.trim();
  if (!password) {
    alert("Password tidak boleh kosong");
    return;
  }

  await loginAdmin(password);
};

logoutBtn.onclick = () => {
  location.reload();
};

/*******************************
 * LOGIN ADMIN (CORS SAFE)
 *******************************/
async function loginAdmin(password) {
  try {
    const url =
      API_URL +
      "?action=login&password=" +
      encodeURIComponent(password);

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      currentRole = "admin";
      enterApp();
    } else {
      alert("Password admin salah");
    }
  } catch (err) {
    console.error(err);
    alert("Gagal koneksi ke server");
  }
}

/*******************************
 * MASUK APLIKASI
 *******************************/
function enterApp() {
  loginScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");

  userRoleText.textContent =
    currentRole === "admin" ? "Admin" : "Guest";

  document
    .querySelectorAll(".admin-only")
    .forEach((el) => {
      if (currentRole === "admin") {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });

  initNavigation();
}

/*******************************
 * NAVIGASI MENU
 *******************************/
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page");

  navItems.forEach((btn) => {
    btn.onclick = () => {
      navItems.forEach((b) => b.classList.remove("active"));
      pages.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document
        .getElementById(btn.dataset.page + "Page")
        .classList.add("active");
    };
  });

  // load awal
  loadPengumuman();
}

/*******************************
 * FETCH DATA (GET ONLY)
 *******************************/
async function loadPengumuman() {
  try {
    const res = await fetch(API_URL + "?action=pengumuman");
    const data = await res.json();

    const container = document.getElementById("pengumumanList");
    container.innerHTML = "";

    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${item.judul}</h3>
        <p>${item.isi}</p>
        <small>${item.tanggal}</small>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

/*******************************
 * PLACEHOLDER MODULE
 *******************************/
function loadIuran() {
  console.log("Load iuran");
}

function loadKas() {
  console.log("Load kas");
}

function loadRonda() {
  console.log("Load ronda");
}
