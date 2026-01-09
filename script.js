/*************************
 * CONFIG
 *************************/
const SHEET_URL = "PASTE_URL_GOOGLE_APPS_SCRIPT_KAMU_DI_SINI";
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit

/*************************
 * GLOBAL STATE
 *************************/
let loadingTimeout = null;
let autoRefreshTimer = null;

/*************************
 * LOADING HANDLER (ANTI NYANGKUT)
 *************************/
function showLoading(show = true) {
    const loader = document.getElementById("loadingIndicator");

    clearTimeout(loadingTimeout);

    if (show) {
        loader.classList.remove("hidden");

        // FAIL SAFE: max loading 15 detik
        loadingTimeout = setTimeout(() => {
            console.warn("Force stop loading (timeout)");
            loader.classList.add("hidden");
        }, 15000);
    } else {
        loader.classList.add("hidden");
    }
}

/*************************
 * FETCH HELPER
 *************************/
async function fetchSheet(action) {
    try {
        const res = await fetch(`${SHEET_URL}?action=${action}`);
        if (!res.ok) throw new Error("Fetch error");
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

/*************************
 * PAGE LOADER
 *************************/
function loadPageData(page) {
    showLoading(true);

    try {
        switch (page) {
            case "pengumuman":
                loadPengumuman();
                break;
            case "iuran":
                loadIuranBulanan();
                break;
            case "kas":
                loadUangKas();
                break;
            case "ronda":
                loadJadwalRonda();
                break;
            default:
                showLoading(false);
        }
    } catch (e) {
        console.error(e);
        showLoading(false);
    }
}

/*************************
 * PENGUMUMAN
 *************************/
async function loadPengumuman() {
    const data = await fetchSheet("pengumuman");
    const container = document.getElementById("pengumumanList");
    container.innerHTML = "";

    if (data.length <= 1) {
        container.innerHTML = "<p>Tidak ada pengumuman</p>";
        showLoading(false);
        return;
    }

    data.slice(1).forEach(row => {
        container.innerHTML += `
            <div class="card">
                <h4>${row.author || "-"}</h4>
                <p>${row.content || "-"}</p>
            </div>
        `;
    });

    showLoading(false);
}

/*************************
 * IURAN BULANAN
 *************************/
async function loadIuranBulanan() {
    const data = await fetchSheet("iuran");
    const table = document.getElementById("iuranTable");
    table.innerHTML = "";

    if (data.length <= 1) {
        table.innerHTML = "<tr><td>Tidak ada data</td></tr>";
        showLoading(false);
        return;
    }

    // Header
    table.innerHTML += `
        <tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join("")}</tr>
    `;

    // Body
    data.forEach(row => {
        table.innerHTML += `
            <tr>${Object.values(row).map(v => `<td>${v}</td>`).join("")}</tr>
        `;
    });

    showLoading(false);
}

/*************************
 * KAS
 *************************/
async function loadUangKas() {
    const data = await fetchSheet("kas");
    const container = document.getElementById("kasContainer");
    container.innerHTML = "";

    if (data.length <= 1) {
        container.innerHTML = "<p>Data kas kosong</p>";
        showLoading(false);
        return;
    }

    let saldo = 0;

    data.slice(1).forEach(row => {
        const masuk = Number(row.masuk || 0);
        const keluar = Number(row.keluar || 0);
        saldo += masuk - keluar;

        container.innerHTML += `
            <div class="card">
                <strong>${row.keterangan}</strong><br>
                Masuk: Rp ${masuk}<br>
                Keluar: Rp ${keluar}
            </div>
        `;
    });

    document.getElementById("statTotalSaldo").innerText = `Rp ${saldo}`;
    showLoading(false);
}

/*************************
 * RONDA
 *************************/
async function loadJadwalRonda() {
    const data = await fetchSheet("ronda");
    const container = document.querySelector("#rondaPage .table-container");
    container.innerHTML = "";

    if (data.length <= 1) {
        container.innerHTML = "<p>Belum ada jadwal ronda</p>";
        showLoading(false);
        return;
    }

    const table = document.createElement("table");
    table.className = "data-table";

    // Header
    table.innerHTML += `
        <tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join("")}</tr>
    `;

    // Body
    data.forEach(row => {
        table.innerHTML += `
            <tr>${Object.values(row).map(v => `<td>${v === true ? "✔️" : v}</td>`).join("")}</tr>
        `;
    });

    container.appendChild(table);
    showLoading(false);
}

/*************************
 * EXPORT
 *************************/
function exportToExcel() {
    showLoading(true);

    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, ws, "Kas");
        XLSX.writeFile(wb, "kas.xlsx");
    } catch (e) {
        console.error(e);
    } finally {
        showLoading(false);
    }
}

/*************************
 * NAVIGATION
 *************************/
document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById(`${btn.dataset.page}Page`).classList.add("active");

        loadPageData(btn.dataset.page);
    });
});

/*************************
 * REFRESH
 *************************/
document.getElementById("refreshBtn").addEventListener("click", () => {
    const active = document.querySelector(".nav-item.active").dataset.page;
    loadPageData(active);
});

/*************************
 * AUTO REFRESH
 *************************/
clearInterval(autoRefreshTimer);
autoRefreshTimer = setInterval(() => {
    const active = document.querySelector(".nav-item.active").dataset.page;
    loadPageData(active);
}, AUTO_REFRESH_INTERVAL);

/*************************
 * INIT
 *************************/
document.addEventListener("DOMContentLoaded", () => {
    loadPageData("pengumuman");
});
