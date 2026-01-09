// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv',
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv',
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv',
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv'
};

// Variabel Penampung Data Global
let rawKasData = []; 
let rawRondaData = [];

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

document.addEventListener('DOMContentLoaded', () => {
    refreshBtn.addEventListener('click', refreshAllData);
    navItems.forEach(item => {
        item.addEventListener('click', () => switchPage(item.getAttribute('data-page')));
    });
    loadInitialData();
    setInterval(refreshAllData, 5 * 60 * 1000); // Auto refresh tiap 5 menit
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
    const activePageElement = document.querySelector('.page.active');
    if (activePageElement) {
        const activePage = activePageElement.id.replace('Page', '');
        loadPageData(activePage);
    }
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
    const buster = `${url}&t=${new Date().getTime()}`;
    return new Promise((resolve, reject) => {
        fetch(buster)
            .then(res => res.text())
            .then(csvText => {
                const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                resolve(results.data);
            })
            .catch(err => reject(err));
    });
}

function showLoading(show) {
    if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !show);
}

function updateLastUpdateTime() {
    if (lastUpdate) lastUpdate.textContent = `Update: ${moment().format('HH:mm')}`;
}

function formatNumber(n) { 
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
}

// ---------------------------------------------------------
// 1. PENGUMUMAN
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 2. IURAN BULANAN
// ---------------------------------------------------------
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
                        html += `<td class="text-center"><div class="checkbox-container"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></div></td>`;
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

// ---------------------------------------------------------
// 3. UANG KAS (DASHBOARD & LAPORAN)
// ---------------------------------------------------------
function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            rawKasData = data; 
            renderUangKas(data);
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

function renderUangKas(data) {
    kasContainer.innerHTML = '';
    if (!data || data.length <= 1) {
        kasContainer.innerHTML = '<p class="text-center">Data kas tidak ditemukan.</p>';
        return;
    }

    let grandTotalSaldo = 0;
    let currentMonthIn = 0;
    let currentMonthOut = 0;
    
    const barisTerakhir = data[data.length - 1];
    const namaBulanTerkini = barisTerakhir[1]; 
    const monthsGroup = {};

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue;
        const masuk = parseInt(row[4]?.toString().replace(/[^0-9]/g, "")) || 0;
        const keluar = parseInt(row[5]?.toString().replace(/[^0-9]/g, "")) || 0;
        grandTotalSaldo += (masuk - keluar);

        if (row[1] === namaBulanTerkini) {
            currentMonthIn += masuk;
            currentMonthOut += keluar;
        }

        if (!monthsGroup[row[1]]) monthsGroup[row[1]] = [];
        monthsGroup[row[1]].push({ tgl: row[2], ket: row[3], masuk, keluar });
    }

    document.getElementById('statTotalSaldo').innerText = `Rp ${formatNumber(grandTotalSaldo)}`;
    document.getElementById('statTotalMasuk').innerText = `Rp ${formatNumber(currentMonthIn)}`;
    document.getElementById('statTotalKeluar').innerText = `Rp ${formatNumber(currentMonthOut)}`;
    
    Object.keys(monthsGroup).reverse().forEach((m, idx) => {
        const accDiv = document.createElement('div');
        accDiv.className = `month-accordion ${idx === 0 ? 'active' : ''}`;
        
        let subBalance = 0;
        let rowsHtml = monthsGroup[m].map(item => {
            subBalance += (item.masuk - item.keluar);
            return `
                <tr>
                    <td>${item.tgl}</td>
                    <td>${item.ket}</td>
                    <td><span class="badge ${item.masuk > 0 ? 'badge-in' : ''}">${item.masuk > 0 ? '+' + formatNumber(item.masuk) : '-'}</span></td>
                    <td><span class="badge ${item.keluar > 0 ? 'badge-out' : ''}">${item.keluar > 0 ? '-' + formatNumber(item.keluar) : '-'}</span></td>
                    <td class="text-right"><strong>${formatNumber(subBalance)}</strong></td>
                </tr>`;
        }).join('');

        accDiv.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <div class="acc-left"><i class="fas fa-calendar-check"></i> <span>${m}</span></div>
                <div class="acc-right">
                    <span class="label-saldo-header">Saldo Akhir:</span>
                    <span class="value-saldo-header">Rp ${formatNumber(subBalance)}</span>
                    <i class="fas fa-chevron-down ml-10"></i>
                </div>
            </div>
            <div class="accordion-content">
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Tgl</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr></thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>`;
        kasContainer.appendChild(accDiv);
    });
}

function exportToExcel() {
    if (rawKasData.length === 0) return alert("Tunggu data kas dimuat!");
    const ws = XLSX.utils.aoa_to_sheet(rawKasData);
    const wb = XLSX.utils.book_new();
    XLSUtils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, `Kas_EMURAI_${moment().format('YYYYMMDD')}.xlsx`);
}

async function exportToPDF() {
    if (rawKasData.length <= 1) return alert("Data kas belum terisi!");
    showLoading(true);
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.setFontSize(18);
        doc.text("LAPORAN KAS E-MURAI", 14, 20);
        
        let globalBalance = 0;
        const grouped = {};
        for (let i = 1; i < rawKasData.length; i++) {
            const bulan = rawKasData[i][1];
            if (!grouped[bulan]) grouped[bulan] = [];
            grouped[bulan].push(rawKasData[i]);
        }

        let currentY = 30;
        for (const bulan of Object.keys(grouped)) {
            const rows = grouped[bulan].map(r => {
                const vIn = parseInt(r[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                const vOut = parseInt(r[5]?.toString().replace(/[^0-9]/g, "")) || 0;
                globalBalance += (vIn - vOut);
                return [r[2], r[3], formatNumber(vIn), formatNumber(vOut), formatNumber(globalBalance)];
            });

            doc.text(`Bulan: ${bulan}`, 14, currentY);
            doc.autoTable({
                startY: currentY + 5,
                head: [['Tgl', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [67, 97, 238] },
                didDrawPage: (d) => { currentY = d.cursor.y + 15; }
            });
        }
        doc.save(`Laporan_Kas_EMurai.pdf`);
    } catch (err) { alert("Gagal PDF: " + err.message); }
    finally { showLoading(false); }
}

// ---------------------------------------------------------
// 4. JADWAL RONDA (SISTEM BAR VISUAL & SORTING)
// ---------------------------------------------------------
function loadJadwalRonda() {
    fetchAndParseCSV(csvUrls.ronda)
        .then(data => {
            if (data.length <= 1) return;
            rawRondaData = data;

            const rondaPage = document.getElementById('rondaPage');
            const tableContainer = rondaPage.querySelector('.table-container');
            tableContainer.style.overflowX = "hidden";
            tableContainer.innerHTML = '<div id="rondaVisualList" class="ronda-visual-container"></div>';
            const listContainer = document.getElementById('rondaVisualList');

            const headers = data[0];
            const lastRondaIdx = headers.length - 1;

              // Mapping & Sorting
            let rondaList = [];
            for (let i = 1; i < data.length; i++) {
                // Pastikan kolom terakhir diambil sebagai angka murni
                const nilaiHari = parseInt(data[i][lastRondaIdx]) || 0;
                rondaList.push({
                    nama: data[i][0],
                    hariTerakhir: nilaiHari
                });
            }
            
            // Logika Sorting yang Lebih Kuat:
            rondaList.sort((a, b) => {
                // 1. Cek jika salah satu sedang ronda (nilai 0)
                if (a.hariTerakhir === 0 && b.hariTerakhir !== 0) return -1; 
                if (a.hariTerakhir !== 0 && b.hariTerakhir === 0) return 1;
                
                // 2. Jika keduanya bukan 0, urutkan dari yang TERBESAR ke terkecil
                return b.hariTerakhir - a.hariTerakhir;
            });

            const maxHari = Math.max(...rondaList.map(item => item.hariTerakhir));

            rondaList.forEach(item => {
                let persentase, labelTeks, statusClass;

                if (item.hariTerakhir === 0) {
                    persentase = 100;
                    labelTeks = "SEDANG RONDA";
                    statusClass = "status-ronda";
                } else {
                    persentase = maxHari > 0 ? (item.hariTerakhir / maxHari) * 100 : 0;
                    labelTeks = `Sudah ${item.hariTerakhir} hari tidak ronda`;
                    statusClass = "";
                }

                const itemHtml = `
                    <div class="ronda-item ${statusClass}">
                        <div class="ronda-info">
                            <span class="ronda-name">${item.nama}</span>
                            <span class="ronda-days">${item.hariTerakhir === 0 ? 'Aktif Malam Ini' : item.hariTerakhir + ' Hari'}</span>
                        </div>
                        <div class="ronda-bar-bg">
                            <div class="ronda-bar-fill" style="width: ${persentase}%"></div>
                            <div class="ronda-bar-text">${labelTeks}</div>
                        </div>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', itemHtml);
            });
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

async function exportRondaPDF() {
    if (!rawRondaData || rawRondaData.length <= 1) {
        alert("Data belum siap. Silakan refresh halaman.");
        return;
    }
    
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const headers = rawRondaData[0]; // Baris pertama (Nama, Tanggal-tanggal, Terakhir Ronda)
        const dataWarga = rawRondaData.slice(1); // Baris data warga
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("LAPORAN PERSONIL RONDA PER TANGGAL", 14, 20);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Dicetak pada: ${moment().format('DD MMMM YYYY, HH:mm')}`, 14, 27);
        doc.line(14, 30, 196, 30); // Garis pemisah

        let currentY = 40;
        const marginX = 14;

        // Loop mulai dari kolom index 1 (tanggal pertama) 
        // sampai kolom sebelum terakhir (karena kolom terakhir adalah 'Terakhir Ronda')
        for (let col = 1; col < headers.length - 1; col++) {
            const tanggalRonda = headers[col];
            let personilMalamIni = [];

            // Cek setiap warga di kolom tanggal ini
            dataWarga.forEach(row => {
                const namaWarga = row[0];
                const statusRonda = (row[col] || "").toString().toUpperCase();
                
                if (statusRonda === 'TRUE') {
                    personilMalamIni.push(namaWarga);
                }
            });

            // Hanya tampilkan tanggal yang ada personilnya
            if (personilMalamIni.length > 0) {
                // Cek apakah halaman masih cukup
                if (currentY > 260) {
                    doc.addPage();
                    currentY = 20;
                }

                // Tulis Header Tanggal
                doc.setFont(undefined, 'bold');
                doc.setFontSize(11);
                doc.text(`Jadwal Ronda Tanggal: ${tanggalRonda}`, marginX, currentY);
                currentY += 7;

                // Tulis List Nama
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                personilMalamIni.forEach((nama, index) => {
                    doc.text(`${index + 1}. ${nama}`, marginX + 5, currentY);
                    currentY += 6;
                });

                currentY += 5; // Spasi antar tanggal
                doc.setDrawColor(230);
                doc.line(marginX, currentY - 2, 100, currentY - 2); // Garis tipis pemisah
                currentY += 5;
            }
        }

        doc.save(`Personil_Ronda_EMurai_${moment().format('YYYYMMDD')}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Gagal membuat PDF: " + e.message);
    } finally {
        showLoading(false);
    }
}
