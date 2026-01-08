// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv',
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv',
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv',
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv'
};

// DOM elements
const mainScreen = document.getElementById('mainScreen');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadingIndicator = document.getElementById('loadingIndicator');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Page specific elements
const pengumumanList = document.getElementById('pengumumanList');
const iuranTable = document.getElementById('iuranTable');
const kasContainer = document.getElementById('kasContainer');
const rondaTable = document.getElementById('rondaTable');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log("Aplikasi E-MURAI Dimulai.");
    
    refreshBtn.addEventListener('click', refreshAllData);
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageName = this.getAttribute('data-page');
            switchPage(pageName);
        });
    });
    
    loadInitialData();
    
    // Auto refresh setiap 5 menit
    setInterval(refreshAllData, 5 * 60 * 1000);
});

// Navigation logic
function switchPage(pageName) {
    navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-page') === pageName);
    });
    
    pages.forEach(page => {
        page.classList.toggle('active', page.id === `${pageName}Page`);
    });
    
    loadPageData(pageName);
}

function loadInitialData() {
    refreshAllData();
}

function refreshAllData() {
    const activePage = document.querySelector('.page.active').id.replace('Page', '');
    loadPageData(activePage);
}

function loadPageData(pageName) {
    showLoading(true);
    switch (pageName) {
        case 'pengumuman': loadPengumuman(); break;
        case 'iuran': loadIuranBulanan(); break;
        case 'kas': loadUangKas(); break;
        case 'ronda': loadJadwalRonda(); break;
    }
}

// Fetch and Parse CSV
function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(csvText => {
                const results = Papa.parse(csvText, {
                    header: false,
                    skipEmptyLines: true
                });
                resolve(results.data);
            })
            .catch(error => reject(error));
    });
}

function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}

function updateLastUpdateTime() {
    const now = moment().format('DD MMMM YYYY, HH:mm:ss');
    lastUpdate.textContent = `Terakhir diperbarui: ${now}`;
}

// 1. Render Pengumuman
function loadPengumuman() {
    fetchAndParseCSV(csvUrls.pengumuman)
        .then(data => {
            renderPengumuman(data);
            updateLastUpdateTime();
        })
        .catch(err => showToast('Error: ' + err.message, 'error'))
        .finally(() => showLoading(false));
}

function renderPengumuman(data) {
    pengumumanList.innerHTML = '';
    if (data.length <= 1) {
        pengumumanList.innerHTML = '<p>Belum ada pengumuman.</p>';
        return;
    }
    for (let i = 1; i < data.length; i++) {
        if (data[i].length < 4) continue;
        const [id, tanggal, judul, isi, pengirim] = data[i];
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${judul}</h3>
                <span class="card-date">${moment(tanggal).format('DD MMM YYYY')}</span>
            </div>
            <div class="card-content"><p>${isi}</p></div>
            <div class="card-footer"><span>Oleh: ${pengirim || '-'}</span></div>
        `;
        pengumumanList.appendChild(card);
    }
}

// 2. Render Iuran Bulanan (FIXED: Horizontal Checkbox)
function loadIuranBulanan() {
    fetchAndParseCSV(csvUrls.iuran)
        .then(data => {
            renderIuranBulanan(data);
            updateLastUpdateTime();
        })
        .catch(err => showToast('Error: ' + err.message, 'error'))
        .finally(() => showLoading(false));
}

function renderIuranBulanan(data) {
    if (data.length === 0) {
        iuranTable.innerHTML = '<tr><td>Tidak ada data</td></tr>';
        return;
    }

    const headers = data[0];
    let html = '<thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        for (let j = 0; j < headers.length; j++) {
            const val = (data[i][j] || "").toString().toUpperCase();
            if (val === 'TRUE' || val === 'FALSE') {
                html += `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>`;
            } else {
                html += `<td>${data[i][j] || '-'}</td>`;
            }
        }
        html += '</tr>';
    }
    iuranTable.innerHTML = html + '</tbody>';
}

// 3. Render Uang Kas
function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            renderUangKas(data);
            updateLastUpdateTime();
        })
        .catch(err => showToast('Error Kas: ' + err.message, 'error'))
        .finally(() => showLoading(false));
}

function renderUangKas(data) {
    kasContainer.innerHTML = '';
    if (data.length <= 1) return;

    const transactionsByMonth = {};
    for (let i = 1; i < data.length; i++) {
        const [id, bulan, tgl, ket, masuk, keluar] = data[i];
        if (!transactionsByMonth[bulan]) transactionsByMonth[bulan] = [];
        transactionsByMonth[bulan].push({
            tgl, ket, 
            masuk: parseInt(masuk) || 0, 
            keluar: parseInt(keluar) || 0
        });
    }

    Object.keys(transactionsByMonth).forEach(bulan => {
        let balance = 0;
        const monthDiv = document.createElement('div');
        monthDiv.className = 'mb-20';
        
        let tableHtml = `<h3>${bulan}</h3><table class="data-table"><thead>
            <tr><th>Tgl</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr>
            </thead><tbody>`;
        
        transactionsByMonth[bulan].forEach(t => {
            balance += (t.masuk - t.keluar);
            tableHtml += `<tr>
                <td>${moment(t.tgl).format('DD/MM')}</td>
                <td>${t.ket}</td>
                <td class="text-right">${formatNumber(t.masuk)}</td>
                <td class="text-right">${formatNumber(t.keluar)}</td>
                <td class="text-right"><strong>${formatNumber(balance)}</strong></td>
            </tr>`;
        });
        
        monthDiv.innerHTML = tableHtml + '</tbody></table>';
        kasContainer.appendChild(monthDiv);
    });
}

// 4. Render Jadwal Ronda (FIXED: Horizontal Checkbox)
function loadJadwalRonda() {
    fetchAndParseCSV(csvUrls.ronda)
        .then(data => {
            renderJadwalRonda(data);
            updateLastUpdateTime();
        })
        .catch(err => showToast('Error Ronda: ' + err.message, 'error'))
        .finally(() => showLoading(false));
}

function renderJadwalRonda(data) {
    if (data.length === 0) {
        rondaTable.innerHTML = '<tr><td>Tidak ada data</td></tr>';
        return;
    }

    const headers = data[0];
    let html = '<thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        for (let j = 0; j < headers.length; j++) {
            const val = (data[i][j] || "").toString().toUpperCase();
            
            if (val === 'TRUE' || val === 'FALSE') {
                html += `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>`;
            } else {
                let cellClass = "";
                if (headers[j].toLowerCase().includes('remaining')) {
                    if (parseInt(data[i][j]) > 30) cellClass = "text-danger font-weight-bold";
                }
                html += `<td class="${cellClass}">${data[i][j] || '-'}</td>`;
            }
        }
        html += '</tr>';
    }
    rondaTable.innerHTML = html + '</tbody>';
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toast Styles
const style = document.createElement('style');
style.textContent = `
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px); 
    background: #333; color: #fff; padding: 12px 24px; border-radius: 8px; transition: 0.3s; opacity: 0; z-index: 9999; }
    .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    .toast-error { background: #ff006e; }
    .text-center { text-align: center; }
`;
document.head.appendChild(style);
