// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv',
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv',
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv',
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv'
};

// Variabel Penampung Data Kas untuk Export
let rawKasData = []; 

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
    // Menambahkan timestamp agar selalu mengambil data terbaru dari Google Sheets
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
    if (lastUpdate) lastUpdate.textContent = `Terakhir diperbarui: ${moment().format('DD MMMM YYYY, HH:mm:ss')}`;
}

function formatNumber(n) { 
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
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

// 2. IURAN BULANAN
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
function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            rawKasData = data; // Penting: Simpan ke variabel global agar tidak error saat export
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
    
    const textLabels = document.querySelectorAll('.stat-info span');
    if(textLabels[1]) textLabels[1].innerText = `Masuk (${namaBulanTerkini})`;
    if(textLabels[2]) textLabels[2].innerText = `Keluar (${namaBulanTerkini})`;

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

// FUNGSI EXPORT EXCEL
function exportToExcel() {
    if (rawKasData.length === 0) return alert("Tunggu data kas dimuat!");
    const ws = XLSX.utils.aoa_to_sheet(rawKasData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, `Laporan_Kas_EMURAI_${moment().format('YYYYMMDD')}.xlsx`);
}

// FUNGSI EXPORT PDF DENGAN GRAFIK
async function getChartImage() {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 400;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');

            const monthsGroup = {};
            rawKasData.slice(1).forEach(row => {
                if (!row[1]) return;
                if (!monthsGroup[row[1]]) monthsGroup[row[1]] = { in: 0, out: 0 };
                monthsGroup[row[1]].in += parseInt(row[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                monthsGroup[row[1]].out += parseInt(row[5]?.toString().replace(/[^0-9]/g, "")) || 0;
            });

            const labels = Object.keys(monthsGroup);
            const dataIn = labels.map(l => monthsGroup[l].in);
            const dataOut = labels.map(l => monthsGroup[l].out);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Masuk', data: dataIn, borderColor: '#4361ee', backgroundColor: '#4361ee', tension: 0.3 },
                        { label: 'Keluar', data: dataOut, borderColor: '#ff006e', backgroundColor: '#ff006e', tension: 0.3 }
                    ]
                },
                options: {
                    animation: {
                        onComplete: function() {
                            const imgData = canvas.toDataURL('image/png');
                            document.body.removeChild(canvas);
                            resolve(imgData);
                        }
                    }
                }
            });
        } catch (e) { resolve(null); }
    });
}

async function exportToPDF() {
    if (rawKasData.length <= 1) return alert("Data kas belum terisi!");
    showLoading(true);
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        doc.setFontSize(18);
        doc.text("LAPORAN BULANAN KAS E-MURAI", 14, 20);
        doc.setFontSize(10);
        doc.text(`Dicetak: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 27);
        
        const chartBase64 = await getChartImage();
        if (chartBase64) {
            doc.addImage(chartBase64, 'PNG', 14, 35, 180, 70);
            doc.text("Grafik Arus Kas (Pemasukan vs Pengeluaran)", 14, 110);
        }

        let currentY = chartBase64 ? 120 : 40;
        let globalBalance = 0;
        const grouped = {};
        for (let i = 1; i < rawKasData.length; i++) {
            const bulan = rawKasData[i][1];
            if (!grouped[bulan]) grouped[bulan] = [];
            grouped[bulan].push(rawKasData[i]);
        }

        for (const bulan of Object.keys(grouped)) {
            const saldoAwal = globalBalance;
            let mIn = 0, mOut = 0;
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            
            doc.setFontSize(11); doc.setFont(undefined, 'bold');
            doc.text(`BULAN: ${bulan.toUpperCase()}`, 14, currentY);
            doc.setFontSize(9);
            doc.text(`Saldo Sebelumnya: Rp ${formatNumber(saldoAwal)}`, 196, currentY, { align: 'right' });
            
            const rows = grouped[bulan].map(r => {
                const vIn = parseInt(r[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                const vOut = parseInt(r[5]?.toString().replace(/[^0-9]/g, "")) || 0;
                mIn += vIn; mOut += vOut; globalBalance += (vIn - vOut);
                return [r[2], r[3], formatNumber(vIn), formatNumber(vOut), formatNumber(globalBalance)];
            });

            rows.push([
                { content: 'TOTAL '+bulan, colSpan: 2, styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
                { content: formatNumber(mIn), styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
                { content: formatNumber(mOut), styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
                { content: 'Saldo Akhir: ' + formatNumber(globalBalance), styles: { fillColor: [230, 240, 255], fontStyle: 'bold' } }
            ]);

            doc.autoTable({
                startY: currentY + 5,
                head: [['Tgl', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [67, 97, 238] },
                margin: { left: 14, right: 14 },
                didDrawPage: (d) => { currentY = d.cursor.y + 15; }
            });
        }
        doc.save(`Laporan_Kas_EMurai_${moment().format('MMM_YYYY')}.pdf`);
    } catch (err) { alert("Gagal membuat PDF: " + err.message); }
    finally { showLoading(false); }
}

// 4. JADWAL RONDA
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
                        html += `<td>${data[i][j] || '-'}</td>`;
                    }
                }
                html += '</tr>';
            }
            rondaTable.innerHTML = html + '</tbody>';
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}
