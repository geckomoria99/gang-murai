// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv',
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv',
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv',
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2)5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv'
};

let rawKasData = []; 

const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadingIndicator = document.getElementById('loadingIndicator');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pengumumanList = document.getElementById('pengumumanList');
const iuranTable = document.getElementById('iuranTable');
const kasContainer = document.getElementById('kasContainer');
const rondaTable = document.getElementById('rondaTable');

document.addEventListener('DOMContentLoaded', () => {
    refreshBtn?.addEventListener('click', refreshAllData);
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

function loadInitialData() { refreshAllData(); }

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

function showLoading(show) { if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !show); }
function updateLastUpdateTime() { if (lastUpdate) lastUpdate.textContent = `Terakhir diperbarui: ${moment().format('DD MMMM YYYY, HH:mm:ss')}`; }
function formatNumber(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

// --- 1. PENGUMUMAN ---
function loadPengumuman() {
    fetchAndParseCSV(csvUrls.pengumuman).then(data => {
        pengumumanList.innerHTML = '';
        if (data.length <= 1) { pengumumanList.innerHTML = '<p>Tidak ada pengumuman.</p>'; return; }
        for (let i = 1; i < data.length; i++) {
            const [id, tgl, judul, isi, pengirim] = data[i];
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="card-header"><h3 class="card-title">${judul}</h3><span>${moment(tgl).format('DD/MM/YY')}</span></div>
                              <div class="card-content"><p>${isi}</p></div>
                              <div class="card-footer"><span>Oleh: ${pengirim}</span></div>`;
            pengumumanList.appendChild(card);
        }
        updateLastUpdateTime();
    }).finally(() => showLoading(false));
}

// --- 2. IURAN ---
function loadIuranBulanan() {
    fetchAndParseCSV(csvUrls.iuran).then(data => {
        if (data.length === 0) return;
        const headers = data[0];
        let html = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
        for (let i = 1; i < data.length; i++) {
            if (!data[i][0]) continue;
            html += '<tr>';
            for (let j = 0; j < headers.length; j++) {
                const val = (data[i][j] || "").toString().trim().toUpperCase();
                html += (val === 'TRUE' || val === 'FALSE') ? 
                    `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>` : 
                    `<td>${data[i][j] || '-'}</td>`;
            }
            html += '</tr>';
        }
        iuranTable.innerHTML = html + '</tbody>';
        updateLastUpdateTime();
    }).finally(() => showLoading(false));
}

// --- 3. UANG KAS ---
function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas).then(data => {
        rawKasData = data;
        renderUangKas(data);
        updateLastUpdateTime();
    }).finally(() => showLoading(false));
}

function renderUangKas(data) {
    kasContainer.innerHTML = '';
    if (!data || data.length <= 1) return;
    let grandTotalSaldo = 0, currentMonthIn = 0, currentMonthOut = 0;
    const namaBulanTerkini = data[data.length - 1][1];
    const monthsGroup = {};

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const masuk = parseInt(row[4]?.toString().replace(/[^0-9]/g, "")) || 0;
        const keluar = parseInt(row[5]?.toString().replace(/[^0-9]/g, "")) || 0;
        grandTotalSaldo += (masuk - keluar);
        if (row[1] === namaBulanTerkini) { currentMonthIn += masuk; currentMonthOut += keluar; }
        if (!monthsGroup[row[1]]) monthsGroup[row[1]] = [];
        monthsGroup[row[1]].push({ tgl: row[2], ket: row[3], masuk, keluar });
    }

    document.getElementById('statTotalSaldo').innerText = `Rp ${formatNumber(grandTotalSaldo)}`;
    document.getElementById('statTotalMasuk').innerText = `Rp ${formatNumber(currentMonthIn)}`;
    document.getElementById('statTotalKeluar').innerText = `Rp ${formatNumber(currentMonthOut)}`;

    Object.keys(monthsGroup).reverse().forEach((m, idx) => {
        let subBalance = 0;
        const rowsHtml = monthsGroup[m].map(item => {
            subBalance += (item.masuk - item.keluar);
            return `<tr><td>${item.tgl}</td><td>${item.ket}</td>
                    <td><span class="badge ${item.masuk > 0 ? 'badge-in' : ''}">${item.masuk > 0 ? '+' + formatNumber(item.masuk) : '-'}</span></td>
                    <td><span class="badge ${item.keluar > 0 ? 'badge-out' : ''}">${item.keluar > 0 ? '-' + formatNumber(item.keluar) : '-'}</span></td>
                    <td class="text-right"><strong>${formatNumber(subBalance)}</strong></td></tr>`;
        }).join('');

        const accDiv = document.createElement('div');
        accDiv.className = `month-accordion ${idx === 0 ? 'active' : ''}`;
        accDiv.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <div class="acc-left"><span>${m}</span></div>
                <div class="acc-right"><span class="label-saldo-header">Saldo Akhir:</span>
                <span class="value-saldo-header">Rp ${formatNumber(subBalance)}</span><i class="fas fa-chevron-down ml-10"></i></div>
            </div>
            <div class="accordion-content"><table class="data-table"><thead><tr><th>Tgl</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        kasContainer.appendChild(accDiv);
    });
}

// --- EXPORT PDF ---
async function getChartImage() {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 400; canvas.style.display = 'none';
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const monthsGroup = {};
            rawKasData.slice(1).forEach(row => {
                if (!row[1]) return;
                if (!monthsGroup[row[1]]) monthsGroup[row[1]] = { in: 0, out: 0 };
                monthsGroup[row[1]].in += parseInt(row[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                monthsGroup[row[1]].out += parseInt(row[5]?.toString().replace(/[^0-9]/g, "")) || 0;
            });
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Object.keys(monthsGroup),
                    datasets: [
                        { label: 'Masuk', data: Object.values(monthsGroup).map(v => v.in), borderColor: '#4361ee', tension: 0.3 },
                        { label: 'Keluar', data: Object.values(monthsGroup).map(v => v.out), borderColor: '#ff006e', tension: 0.3 }
                    ]
                },
                options: { animation: { onComplete: () => { const img = canvas.toDataURL('image/png'); document.body.removeChild(canvas); resolve(img); } } }
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
        doc.setFontSize(18); doc.text("LAPORAN BULANAN KAS E-MURAI", 14, 20);
        doc.setFontSize(10); doc.text(`Dicetak: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 27);
        
        const chartBase64 = await getChartImage();
        if (chartBase64) { doc.addImage(chartBase64, 'PNG', 14, 35, 180, 70); }

        let currentY = chartBase64 ? 115 : 40;
        let globalBalance = 0;
        const grouped = {};
        rawKasData.slice(1).forEach(r => { if(!grouped[r[1]]) grouped[r[1]] = []; grouped[r[1]].push(r); });

        for (const bulan of Object.keys(grouped)) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(11); doc.setFont(undefined, 'bold');
            doc.text(`BULAN: ${bulan.toUpperCase()}`, 14, currentY);
            
            let mIn = 0, mOut = 0;
            const rows = grouped[bulan].map(r => {
                const i = parseInt(r[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                const o = parseInt(r[5]?.toString().replace(/[^0-9]/g, "")) || 0;
                mIn += i; mOut += o; globalBalance += (i - o);
                return [r[2], r[3], formatNumber(i), formatNumber(o), formatNumber(globalBalance)];
            });

            rows.push([{ content: 'TOTAL ' + bulan, colSpan: 2 }, formatNumber(mIn), formatNumber(mOut), formatNumber(globalBalance)]);

            doc.autoTable({
                startY: currentY + 3,
                head: [['Tgl', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [67, 97, 238], textColor: [255, 255, 255] },
                styles: { textColor: [0, 0, 0], fontSize: 8 }, // HITAM PEKAT
                didParseCell: function(data) {
                    if (data.row.index === rows.length - 1) {
                        data.cell.styles.fillColor = [76, 175, 80]; // HIJAU
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
                didDrawPage: (d) => { currentY = d.cursor.y + 10; }
            });
        }
        doc.save(`Laporan_Kas_EMurai_${moment().format('DDMMYY')}.pdf`);
    } catch (err) { alert("Error: " + err.message); } finally { showLoading(false); }
}

// --- 4. RONDA ---
function loadJadwalRonda() {
    fetchAndParseCSV(csvUrls.ronda).then(data => {
        if (data.length === 0) return;
        let html = `<thead><tr>${data[0].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
        for (let i = 1; i < data.length; i++) {
            html += `<tr>${data[i].map(v => `<td>${v || '-'}</td>`).join('')}</tr>`;
        }
        rondaTable.innerHTML = html + '</tbody>';
        updateLastUpdateTime();
    }).finally(() => showLoading(false));
}

function exportToExcel() {
    if (rawKasData.length === 0) return alert("Data kas belum terisi!");
    const ws = XLSX.utils.aoa_to_sheet(rawKasData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, `Laporan_Kas_EMURAI.xlsx`);
}
