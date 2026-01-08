// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv',
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv',
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv',
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv'
};

// DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadingIndicator = document.getElementById('loadingIndicator');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Containers
const pengumumanList = document.getElementById('pengumumanList');
const iuranTable = document.getElementById('iuranTable');
const kasContainer = document.getElementById('kasContainer');
const rondaTable = document.getElementById('rondaTable');

document.addEventListener('DOMContentLoaded', () => {
    refreshBtn.addEventListener('click', refreshAllData);
    navItems.forEach(item => {
        item.addEventListener('click', () => switchPage(item.getAttribute('data-page')));
    });
    loadInitialData();
    setInterval(refreshAllData, 5 * 60 * 1000);
});

function switchPage(pageName) {
    navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-page') === pageName));
    pages.forEach(page => page.classList.toggle('active', page.id === `${pageName}Page`));
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

function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => res.text())
            .then(csvText => {
                const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                resolve(results.data);
            })
            .catch(err => reject(err));
    });
}

function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}

function updateLastUpdateTime() {
    lastUpdate.textContent = `Terakhir diperbarui: ${moment().format('DD MMMM YYYY, HH:mm:ss')}`;
}

// 1. PENGUMUMAN
function loadPengumuman() {
    fetchAndParseCSV(csvUrls.pengumuman)
        .then(data => {
            pengumumanList.innerHTML = '';
            if (data.length <= 1) { pengumumanList.innerHTML = '<p>Tidak ada pengumuman.</p>'; return; }
            for (let i = 1; i < data.length; i++) {
                const [id, tgl, judul, isi, pengirim] = data[i];
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header"><h3 class="card-title">${judul}</h3><span>${moment(tgl).format('DD/MM/YY')}</span></div>
                    <div class="card-content"><p>${isi}</p></div>
                    <div class="card-footer"><span>Oleh: ${pengirim}</span></div>`;
                pengumumanList.appendChild(card);
            }
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

// 2. IURAN BULANAN (FIXED: Sesuai Header)
function loadIuranBulanan() {
    fetchAndParseCSV(csvUrls.iuran)
        .then(data => {
            if (data.length === 0) return;
            const headers = data[0];
            let html = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
            
            for (let i = 1; i < data.length; i++) {
                if (!data[i][0]) continue;
                html += '<tr>';
                for (let j = 0; j < headers.length; j++) {
                    const val = (data[i][j] || "").toString().trim().toUpperCase();
                    if (val === 'TRUE' || val === 'FALSE') {
                        html += `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>`;
                    } else {
                        html += `<td>${data[i][j] || '-'}</td>`;
                    }
                }
                html += '</tr>';
            }
            iuranTable.innerHTML = html + '</tbody>';
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

// 3. UANG KAS
let allKasData = []; // Variabel global untuk menampung data kas buat export

function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            allKasData = data;
            renderUangKas(data);
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

function renderUangKas(data) {
    kasContainer.innerHTML = '';
    if (data.length <= 1) return;

    const months = {};
    let grandTotalSaldo = 0;
    let currentMonthIn = 0;
    let currentMonthOut = 0;
    const currentMonthName = moment().format('MMMM'); // Misal: January

    // Parsing data
    for (let i = 1; i < data.length; i++) {
        const [id, bulan, tgl, ket, masuk, keluar] = data[i];
        const valMasuk = parseInt(masuk) || 0;
        const valKeluar = parseInt(keluar) || 0;
        
        grandTotalSaldo += (valMasuk - valKeluar);

        // Hitung total khusus bulan berjalan
        if (bulan.toLowerCase().includes(currentMonthName.toLowerCase())) {
            currentMonthIn += valMasuk;
            currentMonthOut += valKeluar;
        }

        if (!months[bulan]) months[bulan] = [];
        months[bulan].push({ tgl, ket, masuk: valMasuk, keluar: valKeluar });
    }

    // Update Stats Cards
    document.getElementById('statTotalSaldo').textContent = `Rp ${formatNumber(grandTotalSaldo)}`;
    document.getElementById('statTotalMasuk').textContent = `Rp ${formatNumber(currentMonthIn)}`;
    document.getElementById('statTotalKeluar').textContent = `Rp ${formatNumber(currentMonthOut)}`;

    // Render Accordion per Bulan
    Object.keys(months).reverse().forEach((m, idx) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = `month-accordion ${idx === 0 ? 'active' : ''}`; // Buka bulan terbaru
        
        let runningBal = 0;
        let tableRows = months[m].map(t => {
            runningBal += (t.masuk - t.keluar);
            return `
                <tr>
                    <td>${moment(t.tgl).format('DD/MM')}</td>
                    <td>${t.ket}</td>
                    <td><span class="badge ${t.masuk > 0 ? 'badge-in' : ''}">${t.masuk > 0 ? '+' + formatNumber(t.masuk) : '-'}</span></td>
                    <td><span class="badge ${t.keluar > 0 ? 'badge-out' : ''}">${t.keluar > 0 ? '-' + formatNumber(t.keluar) : '-'}</span></td>
                    <td class="text-right"><strong>${formatNumber(runningBal)}</strong></td>
                </tr>`;
        }).join('');

        monthDiv.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span><i class="fas fa-calendar-alt"></i> ${m}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="accordion-content">
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Tgl</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>`;
        kasContainer.appendChild(monthDiv);
    });
}

// FUNGSI EXPORT EXCEL
function exportToExcel() {
    const ws = XLSX.utils.aoa_to_sheet(allKasData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, `Laporan_Kas_EMURAI_${moment().format('YYYYMMDD')}.xlsx`);
}

// FUNGSI EXPORT PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("LAPORAN KEUANGAN KAS E-MURAI", 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${moment().format('DD MMMM YYYY HH:mm')}`, 14, 22);

    const headers = [["ID", "Bulan", "Tanggal", "Keterangan", "Masuk", "Keluar"]];
    const rows = allKasData.slice(1); // Ambil data tanpa header

    doc.autoTable({
        head: headers,
        body: rows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [67, 97, 238] }
    });

    doc.save(`Laporan_Kas_${moment().format('YYYY')}.pdf`);
}

// 4. JADWAL RONDA (FIXED: Sesuai Header)
function loadJadwalRonda() {
    fetchAndParseCSV(csvUrls.ronda)
        .then(data => {
            if (data.length === 0) return;
            const headers = data[0];
            let html = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
            
            for (let i = 1; i < data.length; i++) {
                if (!data[i][0]) continue;
                html += '<tr>';
                for (let j = 0; j < headers.length; j++) {
                    const val = (data[i][j] || "").toString().trim().toUpperCase();
                    if (val === 'TRUE' || val === 'FALSE') {
                        html += `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>`;
                    } else {
                        let cls = headers[j].toLowerCase().includes('remaining') && parseInt(data[i][j]) > 30 ? 'text-danger font-weight-bold' : '';
                        html += `<td class="${cls}">${data[i][j] || '-'}</td>`;
                    }
                }
                html += '</tr>';
            }
            rondaTable.innerHTML = html + '</tbody>';
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

function formatNumber(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

function showToast(m, t = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${t}`;
    toast.textContent = m;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
