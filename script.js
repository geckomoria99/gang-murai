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
let kasDataForChart = []; // Data untuk chart

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

// Fungsi untuk memformat teks dengan line breaks
function formatTextWithBreaks(text) {
    if (!text) return '';
    // Ganti karakter newline dengan <br>
    return text.toString().replace(/\n/g, '<br>');
}

// Fungsi untuk memotong teks dengan titik-titik
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ---------------------------------------------------------
// 1. PENGUMUMAN - DENGAN FITUR EXPAND/COLLAPSE
// ---------------------------------------------------------
function loadPengumuman() {
    fetchAndParseCSV(csvUrls.pengumuman)
        .then(data => {
            pengumumanList.innerHTML = '';
            if (data.length <= 1) { 
                pengumumanList.innerHTML = '<p class="text-center">Tidak ada pengumuman.</p>'; 
                return; 
            }
            
            for (let i = 1; i < data.length; i++) {
                const [id, tgl, judul, isi, pengirim] = data[i];
                const isiFormatted = formatTextWithBreaks(isi);
                const isiTruncated = truncateText(isi, 150);
                
                const card = document.createElement('div');
                card.className = 'card pengumuman-card';
                card.innerHTML = `
                    <div class="card-header pengumuman-header" onclick="togglePengumuman(this)">
                        <div class="pengumuman-header-content">
                            <h3 class="card-title">${judul || 'Tanpa Judul'}</h3>
                            <span class="card-date">${moment(tgl).format('DD/MM/YY')}</span>
                        </div>
                        <i class="fas fa-chevron-down pengumuman-toggle"></i>
                    </div>
                    <div class="card-content pengumuman-content" style="display: none;">
                        <div class="pengumuman-isi">${isiFormatted}</div>
                    </div>
                    <div class="card-footer">
                        <span>Oleh: ${pengirim || 'Admin'}</span>
                    </div>`;
                pengumumanList.appendChild(card);
            }
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

// Fungsi untuk toggle pengumuman
function togglePengumuman(headerElement) {
    const card = headerElement.closest('.pengumuman-card');
    const content = card.querySelector('.pengumuman-content');
    const toggleIcon = headerElement.querySelector('.pengumuman-toggle');
    
    // Tutup semua pengumuman lainnya
    document.querySelectorAll('.pengumuman-card').forEach(otherCard => {
        if (otherCard !== card) {
            const otherContent = otherCard.querySelector('.pengumuman-content');
            const otherIcon = otherCard.querySelector('.pengumuman-toggle');
            if (otherContent) otherContent.style.display = 'none';
            if (otherIcon) {
                otherIcon.classList.remove('fa-chevron-up');
                otherIcon.classList.add('fa-chevron-down');
            }
        }
    });
    
    // Toggle pengumuman ini
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    }
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
                        html += `<td class="text-center">
                            <div class="checkbox-container">
                                <input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled>
                            </div>
                        </td>`;
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

    const bulanData = {};
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue;
        
        const masuk = parseInt(row[4]?.toString().replace(/[^0-9]/g, "")) || 0;
        const keluar = parseInt(row[5]?.toString().replace(/[^0-9]/g, "")) || 0;
        const saldoTransaksi = masuk - keluar;
        
        const transaksi = {
            bulan: row[1],
            tgl: row[2],
            ket: row[3],
            masuk,
            keluar,
            saldoTransaksi
        };
        
        if (!bulanData[row[1]]) {
            bulanData[row[1]] = {
                namaBulan: row[1],
                transaksi: [],
                totalMasuk: 0,
                totalKeluar: 0,
                saldoBulan: 0
            };
        }
        
        bulanData[row[1]].transaksi.push(transaksi);
        bulanData[row[1]].totalMasuk += masuk;
        bulanData[row[1]].totalKeluar += keluar;
        bulanData[row[1]].saldoBulan += saldoTransaksi;
    }
    
    const urutanBulan = {
        'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
        'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
    };
    
    const sortedBulanKeys = Object.keys(bulanData).sort((a, b) => urutanBulan[a] - urutanBulan[b]);
    
    let saldoKumulatifHinggaSekarang = 0;
    const bulanDenganSaldoKumulatif = [];
    kasDataForChart = [];
    
    for (const bulanKey of sortedBulanKeys) {
        const bulan = bulanData[bulanKey];
        saldoKumulatifHinggaSekarang += bulan.saldoBulan;
        
        bulanDenganSaldoKumulatif.push({
            ...bulan,
            saldoKumulatif: saldoKumulatifHinggaSekarang
        });
        
        kasDataForChart.push({
            bulan: bulanKey,
            pemasukan: bulan.totalMasuk,
            pengeluaran: bulan.totalKeluar,
            saldoKumulatif: saldoKumulatifHinggaSekarang
        });
    }
    
    const bulanTerbaru = sortedBulanKeys[sortedBulanKeys.length - 1];
    const currentMonthIn = bulanTerbaru ? bulanData[bulanTerbaru].totalMasuk : 0;
    const currentMonthOut = bulanTerbaru ? bulanData[bulanTerbaru].totalKeluar : 0;
    
    document.getElementById('statTotalSaldo').innerText = `Rp ${formatNumber(saldoKumulatifHinggaSekarang)}`;
    document.getElementById('statTotalMasuk').innerText = `Rp ${formatNumber(currentMonthIn)}`;
    document.getElementById('statTotalKeluar').innerText = `Rp ${formatNumber(currentMonthOut)}`;
    
    const saldoSebelumBulan = {};
    let saldoSebelum = 0;
    
    for (const bulanKey of sortedBulanKeys) {
        saldoSebelumBulan[bulanKey] = saldoSebelum;
        saldoSebelum += bulanData[bulanKey].saldoBulan;
    }
    
    bulanDenganSaldoKumulatif.reverse().forEach((bulanDataItem, idx) => {
        let saldoBerjalan = saldoSebelumBulan[bulanDataItem.namaBulan];
        
        const rowsHtml = bulanDataItem.transaksi.map(item => {
            saldoBerjalan += (item.masuk - item.keluar);
            
            return `
                <tr>
                    <td>${item.tgl}</td>
                    <td>${item.ket}</td>
                    <td><span class="badge ${item.masuk > 0 ? 'badge-in' : ''}">${item.masuk > 0 ? '+' + formatNumber(item.masuk) : '-'}</span></td>
                    <td><span class="badge ${item.keluar > 0 ? 'badge-out' : ''}">${item.keluar > 0 ? '-' + formatNumber(item.keluar) : '-'}</span></td>
                    <td class="text-right"><strong>${formatNumber(saldoBerjalan)}</strong></td>
                </tr>`;
        }).join('');
        
        const totalBulanHtml = `
            <tr class="total-row">
                <td colspan="2" class="font-weight-bold text-right">TOTAL ${bulanDataItem.namaBulan.toUpperCase()}:</td>
                <td class="font-weight-bold text-success">+${formatNumber(bulanDataItem.totalMasuk)}</td>
                <td class="font-weight-bold text-danger">-${formatNumber(bulanDataItem.totalKeluar)}</td>
                <td class="font-weight-bold text-right saldo-kumulatif">Rp ${formatNumber(bulanDataItem.saldoKumulatif)}</td>
            </tr>
        `;
        
        const accDiv = document.createElement('div');
        accDiv.className = `month-accordion ${idx === 0 ? 'active' : ''}`;
        
        accDiv.innerHTML = `
            <div class="accordion-header" onclick="toggleKasAccordion(this)">
                <div class="acc-left">
                    <i class="fas fa-calendar-check"></i> 
                    <span class="month-name">${bulanDataItem.namaBulan}</span>
                </div>
                <div class="acc-right">
                    <i class="fas fa-chevron-down ml-10"></i>
                </div>
            </div>
            <div class="accordion-content">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tgl</th>
                                <th>Keterangan</th>
                                <th>Masuk</th>
                                <th>Keluar</th>
                                <th>Saldo Kumulatif</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            ${totalBulanHtml}
                        </tbody>
                    </table>
                </div>
            </div>`;
        kasContainer.appendChild(accDiv);
    });
}

function toggleKasAccordion(headerElement) {
    const accordion = headerElement.parentElement;
    const isActive = accordion.classList.contains('active');
    
    document.querySelectorAll('.month-accordion').forEach(acc => {
        acc.classList.remove('active');
    });
    
    if (!isActive) {
        accordion.classList.add('active');
    }
}

async function exportToPDF() {
    if (rawKasData.length <= 1) return alert("Data kas belum terisi!");
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Header
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("LAPORAN KAS E-MURAI", 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`System Management Gang Murai - Periode: ${moment().format('DD MMMM YYYY')}`, 105, 28, { align: 'center' });
        
        const grouped = {};
        for (let i = 1; i < rawKasData.length; i++) {
            const bulan = rawKasData[i][1];
            if (!grouped[bulan]) grouped[bulan] = [];
            grouped[bulan].push(rawKasData[i]);
        }
        
        const urutanBulan = {
            'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
            'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
        };
        
        const sortedMonths = Object.keys(grouped).sort((a, b) => urutanBulan[a] - urutanBulan[b]);

        let globalBalance = 0;
        let currentY = 40;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        
        const chartData = {
            labels: [],
            pemasukan: [],
            pengeluaran: [],
            saldo: []
        };
        
        const totalColumns = 5;
        const equalColumnWidth = contentWidth / totalColumns - 5;
        
        for (const bulan of sortedMonths) {
            const rows = grouped[bulan];
            let totalMasuk = 0;
            let totalKeluar = 0;
            
            const rowData = rows.map(r => {
                const vIn = parseInt(r[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                const vOut = parseInt(r[5]?.toString().replace(/[^0-9]/g, "")) || 0;
                totalMasuk += vIn;
                totalKeluar += vOut;
                const saldoSebelum = globalBalance;
                globalBalance += (vIn - vOut);
                return {
                    tgl: r[2],
                    ket: r[3],
                    masuk: vIn,
                    keluar: vOut,
                    saldo: saldoSebelum + (vIn - vOut)
                };
            });
            
            chartData.labels.push(bulan);
            chartData.pemasukan.push(totalMasuk);
            chartData.pengeluaran.push(totalKeluar);
            chartData.saldo.push(globalBalance);
            
            if (currentY > 220) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`Bulan: ${bulan}`, margin, currentY);
            currentY += 8;
            
            const tableData = rowData.map(r => [
                r.tgl,
                r.ket,
                formatNumber(r.masuk),
                formatNumber(r.keluar),
                formatNumber(r.saldo)
            ]);
            
            tableData.push([
                '',
                `TOTAL ${bulan.toUpperCase()}:`,
                formatNumber(totalMasuk),
                formatNumber(totalKeluar),
                formatNumber(globalBalance)
            ]);
            
            doc.autoTable({
                startY: currentY,
                head: [['Tanggal', 'Keterangan', 'Masuk', 'Keluar', 'Saldo Kumulatif']],
                body: tableData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [67, 97, 238], 
                    fontSize: 9,
                    textColor: [255, 255, 255], // PUTIH untuk header (TIDAK diubah)
                    halign: 'center',
                    fontStyle: 'bold'
                },
                bodyStyles: { 
                    fontSize: 8,
                    cellPadding: 3,
                    overflow: 'linebreak',
                    textColor: [0, 0, 0], // Hitam untuk body
                    fontStyle: 'normal'
                },
                columnStyles: {
                    0: { 
                        cellWidth: equalColumnWidth, 
                        halign: 'center',
                        minCellWidth: equalColumnWidth - 2,
                        textColor: [0, 0, 0]
                    },
                    1: { 
                        cellWidth: equalColumnWidth + 10,
                        minCellWidth: equalColumnWidth,
                        textColor: [0, 0, 0]
                    },
                    2: { 
                        cellWidth: equalColumnWidth, 
                        halign: 'right',
                        minCellWidth: equalColumnWidth - 2,
                        textColor: [0, 0, 0]
                    },
                    3: { 
                        cellWidth: equalColumnWidth, 
                        halign: 'right',
                        minCellWidth: equalColumnWidth - 2,
                        textColor: [0, 0, 0]
                    },
                    4: { 
                        cellWidth: equalColumnWidth, 
                        halign: 'right',
                        minCellWidth: equalColumnWidth - 2,
                        textColor: [0, 0, 0]
                    }
                },
                margin: { left: margin, right: margin },
                willDrawCell: function(data) {
                    if (data.row.index === tableData.length - 1) {
                        doc.setFillColor(230, 255, 247);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        
                        doc.setDrawColor(6, 214, 160);
                        doc.setLineWidth(0.5);
                        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                        
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(0, 0, 0);
                        
                        if (data.column.index === 4) {
                            doc.setFillColor(200, 250, 237);
                            doc.roundedRect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 2, 2, 'F');
                        }
                    } else {
                        doc.setTextColor(0, 0, 0);
                    }
                },
                didParseCell: function(data) {
                    if (data.row.index === tableData.length - 1) {
                        data.cell.styles.textColor = [0, 0, 0];
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [0, 0, 0];
                    }
                    
                    if (data.column.index === 0 && data.cell.raw) {
                        if (data.cell.raw.length > 10) {
                            data.cell.text = data.cell.raw.substring(0, 10);
                        }
                    }
                },
                didDrawPage: (d) => { 
                    currentY = d.cursor.y + 5;
                    doc.setTextColor(0, 0, 0);
                }
            });
            
            currentY += 10;
        }
        
        doc.addPage();
        currentY = 20;
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("GRAFIK PEMASUKAN vs PENGELUARAN", 105, currentY, { align: 'center' });
        currentY += 10;
        
        const canvas1 = document.createElement('canvas');
        canvas1.width = 600;
        canvas1.height = 300;
        canvas1.style.display = 'none';
        document.body.appendChild(canvas1);
        
        const ctx1 = canvas1.getContext('2d');
        
        if (chartData.labels.length > 0 && chartData.pemasukan.length > 0) {
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: 'Pemasukan',
                            data: chartData.pemasukan,
                            borderColor: '#06d6a0',
                            backgroundColor: 'rgba(6, 214, 160, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: 'Pengeluaran',
                            data: chartData.pengeluaran,
                            borderColor: '#ef476f',
                            backgroundColor: 'rgba(239, 71, 111, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Trend Pemasukan dan Pengeluaran per Bulan',
                            font: {
                                size: 14,
                                color: '#000000'
                            }
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    size: 10
                                },
                                color: '#000000'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: '#000000'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: '#000000',
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                    } else if (value >= 1000) {
                                        return 'Rp ' + (value / 1000).toFixed(0) + 'k';
                                    }
                                    return 'Rp ' + value;
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const chartImage1 = canvas1.toDataURL('image/png', 1.0);
            doc.addImage(chartImage1, 'PNG', margin, currentY, contentWidth, 80);
            currentY += 90;
        }
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("GRAFIK SALDO KUMULATIF", 105, currentY, { align: 'center' });
        currentY += 10;
        
        const canvas2 = document.createElement('canvas');
        canvas2.width = 600;
        canvas2.height = 300;
        canvas2.style.display = 'none';
        document.body.appendChild(canvas2);
        
        const ctx2 = canvas2.getContext('2d');
        
        if (chartData.labels.length > 0 && chartData.saldo.length > 0) {
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Saldo Kumulatif',
                        data: chartData.saldo,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Perkembangan Saldo Kas dari Waktu ke Waktu',
                            font: {
                                size: 14,
                                color: '#000000'
                            }
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    size: 10
                                },
                                color: '#000000'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: '#000000'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y: {
                            beginAtZero: false,
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: '#000000',
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                    } else if (value >= 1000) {
                                        return 'Rp ' + (value / 1000).toFixed(0) + 'k';
                                    }
                                    return 'Rp ' + value;
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const chartImage2 = canvas2.toDataURL('image/png', 1.0);
            doc.addImage(chartImage2, 'PNG', margin, currentY, contentWidth, 80);
            currentY += 90;
        }
        
        if (canvas1.parentNode) document.body.removeChild(canvas1);
        if (canvas2.parentNode) document.body.removeChild(canvas2);
        
        currentY += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("RINGKASAN AKHIR", margin, currentY);
        currentY += 8;
        
        const totalPemasukan = chartData.pemasukan.reduce((a, b) => a + b, 0);
        const totalPengeluaran = chartData.pengeluaran.reduce((a, b) => a + b, 0);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const summaryWidth = contentWidth;
        const summaryHeight = 25;
        
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, summaryWidth, summaryHeight, 'F');
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(margin, currentY, summaryWidth, summaryHeight);
        
        const col1 = margin + 10;
        const col2 = margin + summaryWidth / 2;
        
        doc.text(`Total Pemasukan: Rp ${formatNumber(totalPemasukan)}`, col1, currentY + 8);
        doc.text(`Total Pengeluaran: Rp ${formatNumber(totalPengeluaran)}`, col1, currentY + 16);
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text(`Saldo Akhir: Rp ${formatNumber(globalBalance)}`, col2, currentY + 12);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(0, 0, 0);
        doc.text(`Laporan dicetak pada: ${moment().format('DD/MM/YYYY HH:mm')}`, 105, 285, { align: 'center' });
        doc.text(`© System Management Gang Murai ${new Date().getFullYear()}`, 105, 290, { align: 'center' });
        
        doc.save(`Laporan_Kas_EMurai_${moment().format('YYYYMMDD_HHmm')}.pdf`);
        
    } catch (err) { 
        console.error("Error generating PDF:", err);
        alert("Gagal membuat PDF: " + err.message); 
    }
    finally { 
        showLoading(false); 
    }
}

function exportToExcel() {
    if (rawKasData.length === 0) return alert("Tunggu data kas dimuat!");
    const ws = XLSX.utils.aoa_to_sheet(rawKasData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, `Kas_EMURAI_${moment().format('YYYYMMDD')}.xlsx`);
}

// ---------------------------------------------------------
// 4. JADWAL RONDA
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

            let rondaList = [];
            for (let i = 1; i < data.length; i++) {
                rondaList.push({
                    nama: data[i][0],
                    hariTerakhir: parseInt(data[i][lastRondaIdx]) || 0
                });
            }

            rondaList.sort((a, b) => {
                if (a.hariTerakhir === 0) return -1;
                if (b.hariTerakhir === 0) return 1;
                return b.hariTerakhir - a.hariTerakhir;
            });

            const maxHari = Math.max(...rondaList.map(item => item.hariTerakhir));

            rondaList.forEach(item => {
                let persentase, labelTeks, statusClass;

                if (item.hariTerakhir === 0) {
                    persentase = 100;
                    labelTeks = "DIPILIH RONDA";
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
    if (rawRondaData.length <= 1) return alert("Data ronda belum dimuat!");
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // --- HALAMAN 1: REKAP RONDA PER BULAN (PALING ATAS) ---
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text("REKAP RONDA 2026", 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`System Management Gang Murai - Dicetak: ${moment().format('DD MMMM YYYY HH:mm')}`, 105, 22, { align: 'center' });
        
        const headers = rawRondaData[0];
        const dataRows = rawRondaData.slice(1);
        
        // DEBUG: Tampilkan data untuk memeriksa struktur
        console.log("Headers:", headers);
        console.log("Data rows (3 pertama):", dataRows.slice(0, 3));
        
        // Tampilkan contoh data untuk debugging
        if (dataRows.length > 0) {
            console.log("Contoh row pertama:", dataRows[0]);
            console.log("Nilai boolean contoh (kolom 1-3):", 
                dataRows[0][1], dataRows[0][2], dataRows[0][3]);
        }
        
        // Buat struktur data rekap per bulan
        const bulanIndonesia = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        // Inisialisasi struktur data
        const rekapData = {};
        
        // Inisialisasi untuk setiap warga
        dataRows.forEach(row => {
            const namaWarga = row[0];
            if (!namaWarga || namaWarga.trim() === '') return;
            
            const nama = namaWarga.trim();
            rekapData[nama] = {
                nama: nama,
                perBulan: {},
                total: 0
            };
            
            // Inisialisasi 0 untuk semua bulan
            bulanIndonesia.forEach(bulan => {
                rekapData[nama].perBulan[bulan] = 0;
            });
        });
        
        console.log("Jumlah warga terdaftar:", Object.keys(rekapData).length);
        console.log("Nama-nama warga:", Object.keys(rekapData));
        
        // Proses data per tanggal (mulai dari kolom 1 karena kolom 0 adalah nama)
        const dateHeaders = headers.slice(1);
        console.log("Jumlah tanggal:", dateHeaders.length);
        console.log("5 tanggal pertama:", dateHeaders.slice(0, 5));
        
        // Variabel untuk debugging
        let totalKehadiranTerhitung = 0;
        
        dateHeaders.forEach((tanggalStr, colIndex) => {
            // Coba parse tanggal dengan berbagai format
            let bulan = '';
            let tanggalMoment = null;
            
            // Debug: tampilkan tanggal asli
            const tanggalAsli = tanggalStr;
            
            // Coba format DD/MM/YYYY
            tanggalMoment = moment(tanggalStr, 'DD/MM/YYYY');
            
            // Jika tidak valid, coba format lain
            if (!tanggalMoment.isValid()) {
                tanggalMoment = moment(tanggalStr, 'DD-MM-YYYY');
            }
            if (!tanggalMoment.isValid()) {
                tanggalMoment = moment(tanggalStr, 'YYYY-MM-DD');
            }
            if (!tanggalMoment.isValid()) {
                // Coba parsing langsung jika format standar
                tanggalMoment = moment(tanggalStr);
            }
            
            if (tanggalMoment.isValid()) {
                const bulanIndex = tanggalMoment.month(); // 0-11 (Jan=0)
                if (bulanIndex >= 0 && bulanIndex < 12) {
                    bulan = bulanIndonesia[bulanIndex];
                }
            } else {
                console.log("Tanggal tidak valid:", tanggalStr);
                // Coba ekstrak bulan dari string secara manual
                const lowerStr = tanggalStr.toLowerCase();
                bulanIndonesia.forEach((bulanName, idx) => {
                    if (lowerStr.includes(bulanName.toLowerCase())) {
                        bulan = bulanName;
                    }
                });
            }
            
            if (!bulan) {
                console.log(`Tidak bisa menentukan bulan untuk: "${tanggalStr}"`);
                return; // Skip jika tidak bisa parse bulan
            }
            
            // Hitung kehadiran untuk tanggal ini
            dataRows.forEach((row, rowIndex) => {
                const namaWarga = row[0];
                if (!namaWarga || !rekapData[namaWarga]) return;
                
                const statusRonda = row[colIndex + 1]; // +1 karena kolom 0 adalah nama
                const statusStr = statusRonda ? statusRonda.toString().toUpperCase().trim() : '';
                
                // Cek berbagai kemungkinan format true
                const isHadir = statusStr === 'TRUE' || 
                               statusStr === 'YA' || 
                               statusStr === '1' || 
                               statusStr === '✓' ||
                               statusStr === 'X' ||
                               statusStr === 'V';
                
                if (isHadir) {
                    rekapData[namaWarga].perBulan[bulan] = (rekapData[namaWarga].perBulan[bulan] || 0) + 1;
                    rekapData[namaWarga].total += 1;
                    totalKehadiranTerhitung++;
                }
            });
        });
        
        console.log("Total kehadiran terhitung:", totalKehadiranTerhitung);
        
        // Konversi ke array untuk tabel
        const rekapArray = Object.values(rekapData);
        
        // Buat header tabel
        const tableHeaders = ['No', 'Nama Warga', ...bulanIndonesia, 'Total'];
        
        // Buat data tabel dengan nomor urut
        const tableData = rekapArray
            .filter(warga => warga.nama && warga.nama.trim() !== '')
            .map((warga, index) => {
                const rowData = [index + 1, warga.nama];
                
                bulanIndonesia.forEach(bulan => {
                    rowData.push(warga.perBulan[bulan] || 0);
                });
                
                rowData.push(warga.total);
                return rowData;
            });
        
        console.log("Jumlah baris data:", tableData.length);
        
        // Jika tidak ada data sama sekali, tampilkan pesan
        if (tableData.length === 0 || totalKehadiranTerhitung === 0) {
            let currentY = 40;
            doc.setFontSize(14);
            doc.text("Tidak ada data kehadiran ronda ditemukan.", 20, currentY);
            currentY += 15;
            
            // Informasi debugging
            doc.setFontSize(10);
            doc.text(`Data yang dianalisis:`, 20, currentY);
            currentY += 8;
            doc.text(`- Jumlah warga: ${Object.keys(rekapData).length}`, 25, currentY);
            currentY += 6;
            doc.text(`- Jumlah tanggal: ${dateHeaders.length}`, 25, currentY);
            currentY += 6;
            doc.text(`- Format tanggal pertama: "${dateHeaders[0]}"`, 25, currentY);
        } else {
            // Urutkan berdasarkan total tertinggi
            tableData.sort((a, b) => {
                const totalA = a[a.length - 1];
                const totalB = b[b.length - 1];
                return totalB - totalA;
            });
            
            // Update nomor urut setelah sorting
            tableData.forEach((row, index) => {
                row[0] = index + 1;
            });
            
            // Hitung total per bulan
            const totalPerBulan = Array(bulanIndonesia.length).fill(0);
            let grandTotal = 0;
            
            tableData.forEach(row => {
                for (let i = 0; i < bulanIndonesia.length; i++) {
                    totalPerBulan[i] += row[i + 2]; // +2 karena kolom 0=No, 1=Nama
                }
                grandTotal += row[row.length - 1];
            });
            
            console.log("Total per bulan:", totalPerBulan);
            console.log("Grand total:", grandTotal);
            
            // Atur ukuran kolom yang lebih rapat
            const margin = 6; // Margin lebih kecil
            const pageWidth = doc.internal.pageSize.width;
            
            // Hitung lebar kolom - disesuaikan agar muat di A4
            const noColWidth = 8;    // Kolom No
            const namaColWidth = 35; // Kolom nama
            const bulanColWidth = 7; // Kolom bulan (lebih kecil)
            const totalColWidth = 12; // Kolom total
            
            // Buat tabel dengan jsPDF autotable
            doc.autoTable({
                startY: 35,
                head: [tableHeaders],
                body: tableData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [67, 97, 238], 
                    fontSize: 6, // Lebih kecil
                    textColor: [255, 255, 255],
                    halign: 'center',
                    fontStyle: 'bold',
                    cellPadding: 1.5 // Padding lebih kecil
                },
                bodyStyles: { 
                    fontSize: 6, // Lebih kecil
                    cellPadding: 1.5,
                    textColor: [0, 0, 0],
                    overflow: 'linebreak',
                    minCellHeight: 4 // Tinggi sel minimal
                },
                columnStyles: {
                    // Kolom No
                    0: { 
                        cellWidth: noColWidth,
                        halign: 'center',
                        valign: 'middle'
                    },
                    // Kolom nama
                    1: { 
                        cellWidth: namaColWidth,
                        halign: 'left',
                        valign: 'middle'
                    },
                    // Kolom bulan (Januari-Desember)
                    ...bulanIndonesia.reduce((styles, bulan, index) => {
                        styles[index + 2] = { 
                            cellWidth: bulanColWidth,
                            halign: 'center',
                            valign: 'middle'
                        };
                        return styles;
                    }, {}),
                    // Kolom Total
                    [tableHeaders.length - 1]: { 
                        cellWidth: totalColWidth,
                        halign: 'center',
                        valign: 'middle',
                        fontStyle: 'bold'
                    }
                },
                margin: { left: margin, right: margin },
                tableWidth: 'auto',
                styles: {
                    overflow: 'linebreak',
                    cellWidth: 'wrap'
                },
                didParseCell: function(data) {
                    // Jika ini sel data (bukan header)
                    if (data.row.index >= 0 && data.column.index >= 0) {
                        // Untuk sel total (kolom terakhir), beri background jika > 0
                        if (data.column.index === tableHeaders.length - 1 && data.cell.raw > 0) {
                            data.cell.styles.fillColor = [230, 255, 247]; // Hijau muda
                        }
                        // Untuk sel bulan dengan nilai > 0, beri background
                        else if (data.column.index >= 2 && data.column.index < tableHeaders.length - 1 && data.cell.raw > 0) {
                            data.cell.styles.fillColor = [240, 248, 255]; // Biru muda
                        }
                    }
                },
                didDrawPage: function(data) {
                    // Tambahkan total di header
                    doc.setFontSize(8);
                    doc.setFont(undefined, 'bold');
                    doc.text(`Total: ${grandTotal} kali`, pageWidth - 25, 15);
                }
            });
        }
        
        // --- HALAMAN 2: JADWAL RONDA PER TANGGAL ---
        if (dateHeaders.length > 0) {
            doc.addPage();
            let currentY = 20;
            const margin = 15;
            
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text("JADWAL RONDA PER TANGGAL", 105, currentY, { align: 'center' });
            currentY += 10;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text("Berikut adalah daftar warga yang bertugas ronda per tanggal:", margin, currentY);
            currentY += 8;
            
            // Ambil semua tanggal (dari yang terbaru)
            const allDates = dateHeaders.slice().reverse();
            let datesProcessed = 0;
            let pageCount = 1;
            
            allDates.forEach((tanggalStr, index) => {
                // Cek jika perlu halaman baru
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                    pageCount++;
                    
                    // Judul untuk halaman lanjutan
                    doc.setFontSize(16);
                    doc.setFont(undefined, 'bold');
                    doc.text(`JADWAL RONDA PER TANGGAL (lanjutan)`, 105, currentY, { align: 'center' });
                    currentY += 10;
                }
                
                const wargaBertugas = [];
                dataRows.forEach(row => {
                    const namaWarga = row[0];
                    if (!namaWarga) return;
                    
                    const colIndex = headers.indexOf(tanggalStr);
                    if (colIndex > 0) {
                        const statusRonda = row[colIndex];
                        const statusStr = statusRonda ? statusRonda.toString().toUpperCase().trim() : '';
                        
                        // Cek berbagai format true
                        const isHadir = statusStr === 'TRUE' || 
                                       statusStr === 'YA' || 
                                       statusStr === '1' || 
                                       statusStr === '✓' ||
                                       statusStr === 'X' ||
                                       statusStr === 'V';
                        
                        if (isHadir) {
                            wargaBertugas.push(namaWarga.trim());
                        }
                    }
                });
                
                if (wargaBertugas.length > 0) {
                    let formattedDate = tanggalStr;
                    try {
                        const dateMoment = moment(tanggalStr, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']);
                        if (dateMoment.isValid()) {
                            formattedDate = dateMoment.format('dddd, DD MMMM YYYY');
                        }
                    } catch (e) {
                        // Gunakan format asli
                    }
                    
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${formattedDate}:`, margin, currentY);
                    currentY += 6;
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    
                    // Format daftar warga dengan nomor urut
                    wargaBertugas.forEach((nama, idx) => {
                        if (currentY < 280) {
                            doc.text(`${idx + 1}. ${nama}`, margin + 10, currentY);
                            currentY += 5;
                        }
                    });
                    
                    currentY += 4;
                    datesProcessed++;
                }
            });
            
            // Tambahkan ringkasan di akhir
            if (currentY < 270) {
                currentY += 5;
                doc.setFontSize(10);
                doc.setFont(undefined, 'italic');
                doc.text(`Total: ${datesProcessed} hari jadwal ronda tercatat`, margin, currentY);
            }
        }
        
        // Footer semua halaman
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text(`Halaman ${i} dari ${totalPages}`, 105, 285, { align: 'center' });
            doc.text(`© System Management Gang Murai ${new Date().getFullYear()}`, 105, 290, { align: 'center' });
        }
        
        doc.save(`Rekap_Ronda_EMurai_${moment().format('YYYYMMDD_HHmm')}.pdf`);
        
    } catch (err) { 
        console.error("Error generating PDF:", err);
        alert("Gagal membuat PDF: " + err.message); 
    }
    finally { 
        showLoading(false); 
    }
}
