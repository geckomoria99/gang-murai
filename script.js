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
// 3. UANG KAS (DASHBOARD & LAPORAN) - PERBAIKAN SALDO AKUMULATIF YANG BENAR
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

    // Langkah 1: Proses semua data untuk mendapatkan total per bulan dan urutan yang benar
    const bulanData = {};
    const semuaTransaksi = []; // Menyimpan semua transaksi dalam urutan kronologis
    
    // Kumpulkan semua transaksi
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue;
        
        const masuk = parseInt(row[4]?.toString().replace(/[^0-9]/g, "")) || 0;
        const keluar = parseInt(row[5]?.toString().replace(/[^0-9]/g, "")) || 0;
        const saldoTransaksi = masuk - keluar;
        
        // Simpan transaksi
        const transaksi = {
            bulan: row[1],
            tgl: row[2],
            ket: row[3],
            masuk,
            keluar,
            saldoTransaksi
        };
        
        semuaTransaksi.push(transaksi);
        
        // Kelompokkan per bulan
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
    
    // Langkah 2: Urutkan bulan secara kronologis
    const urutanBulan = {
        'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
        'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
    };
    
    const sortedBulanKeys = Object.keys(bulanData).sort((a, b) => urutanBulan[a] - urutanBulan[b]);
    
    // Langkah 3: Hitung saldo kumulatif per bulan
    let saldoKumulatifHinggaSekarang = 0;
    const bulanDenganSaldoKumulatif = [];
    
    for (const bulanKey of sortedBulanKeys) {
        const bulan = bulanData[bulanKey];
        saldoKumulatifHinggaSekarang += bulan.saldoBulan;
        
        bulanDenganSaldoKumulatif.push({
            ...bulan,
            saldoKumulatif: saldoKumulatifHinggaSekarang
        });
    }
    
    // Langkah 4: Hitung statistik untuk bulan terbaru (untuk dashboard)
    const bulanTerbaru = sortedBulanKeys[sortedBulanKeys.length - 1];
    const currentMonthIn = bulanTerbaru ? bulanData[bulanTerbaru].totalMasuk : 0;
    const currentMonthOut = bulanTerbaru ? bulanData[bulanTerbaru].totalKeluar : 0;
    
    // Update statistik dashboard
    document.getElementById('statTotalSaldo').innerText = `Rp ${formatNumber(saldoKumulatifHinggaSekarang)}`;
    document.getElementById('statTotalMasuk').innerText = `Rp ${formatNumber(currentMonthIn)}`;
    document.getElementById('statTotalKeluar').innerText = `Rp ${formatNumber(currentMonthOut)}`;
    
    // Langkah 5: Render accordion dengan urutan bulan terbaru di atas
    // Kita perlu menghitung saldo kumulatif per transaksi untuk setiap bulan
    // Pertama, buat peta saldo kumulatif per bulan
    const saldoSebelumBulan = {}; // Saldo kumulatif sebelum bulan tertentu
    let saldoSebelum = 0;
    
    for (const bulanKey of sortedBulanKeys) {
        saldoSebelumBulan[bulanKey] = saldoSebelum;
        saldoSebelum += bulanData[bulanKey].saldoBulan;
    }
    
    // Render dari bulan terbaru ke terlama
    bulanDenganSaldoKumulatif.reverse().forEach((bulanData, idx) => {
        // Mulai dari saldo kumulatif sebelum bulan ini
        let saldoBerjalan = saldoSebelumBulan[bulanData.namaBulan];
        
        const rowsHtml = bulanData.transaksi.map(item => {
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
        
        const accDiv = document.createElement('div');
        accDiv.className = `month-accordion ${idx === 0 ? 'active' : ''}`;
        
        accDiv.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <div class="acc-left"><i class="fas fa-calendar-check"></i> <span>${bulanData.namaBulan}</span></div>
                <div class="acc-right">
                    <span class="label-saldo-header">Saldo Akhir:</span>
                    <span class="value-saldo-header">Rp ${formatNumber(bulanData.saldoKumulatif)}</span>
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
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
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
        
        // Urutkan data berdasarkan bulan
        const grouped = {};
        for (let i = 1; i < rawKasData.length; i++) {
            const bulan = rawKasData[i][1];
            if (!grouped[bulan]) grouped[bulan] = [];
            grouped[bulan].push(rawKasData[i]);
        }
        
        // Urutkan bulan
        const urutanBulan = {
            'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
            'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
        };
        
        const sortedMonths = Object.keys(grouped).sort((a, b) => urutanBulan[a] - urutanBulan[b]);

        let globalBalance = 0;
        let currentY = 30;
        
        for (const bulan of sortedMonths) {
            const rows = grouped[bulan].map(r => {
                const vIn = parseInt(r[4]?.toString().replace(/[^0-9]/g, "")) || 0;
                const vOut = parseInt(r[5]?.toString().replace(/[^0-9]/g, "")) || 0;
                globalBalance += (vIn - vOut);
                return [r[2], r[3], formatNumber(vIn), formatNumber(vOut), formatNumber(globalBalance)];
            });

            doc.text(`Bulan: ${bulan}`, 14, currentY);
            doc.autoTable({
                startY: currentY + 5,
                head: [['Tgl', 'Keterangan', 'Masuk', 'Keluar', 'Saldo Kumulatif']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [67, 97, 238] },
                didDrawPage: (d) => { currentY = d.cursor.y + 15; }
            });
        }
        
        // Tambahkan summary di akhir
        currentY += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Saldo Akhir: Rp ${formatNumber(globalBalance)}`, 14, currentY);
        
        doc.save(`Laporan_Kas_EMurai_${moment().format('YYYYMMDD')}.pdf`);
    } catch (err) { 
        alert("Gagal membuat PDF: " + err.message); 
    }
    finally { 
        showLoading(false); 
    }
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
                rondaList.push({
                    nama: data[i][0],
                    hariTerakhir: parseInt(data[i][lastRondaIdx]) || 0
                });
            }

            // Urutan: Sedang Ronda (0) -> Terlama ke Terbaru
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
    if (rawRondaData.length <= 1) return alert("Data ronda belum dimuat!");
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Header PDF
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text("LAPORAN JADWAL RONDA", 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Perumahan E-Murai - Dicetak: ${moment().format('DD MMMM YYYY HH:mm')}`, 105, 28, { align: 'center' });
        
        // Data ronda (asumsi format CSV: header di baris 0, data mulai baris 1)
        const headers = rawRondaData[0]; // Nama kolom: Nama, Tanggal1, Tanggal2, ...
        const dataRows = rawRondaData.slice(1); // Data warga
        
        // Hilangkan kolom "Nama" dari headers tanggal
        const dateHeaders = headers.slice(1); // Ambil semua header kecuali "Nama"
        
        // Konversi format data untuk lebih mudah diproses
        // Struktur: { tanggal: "13 Desember 2025", warga: ["Kevin", "Masykur", "Yoga", ...] }
        const jadwalPerTanggal = [];
        
        // Untuk setiap kolom tanggal (setelah kolom Nama)
        dateHeaders.forEach((tanggal, colIndex) => {
            const wargaBertugas = [];
            
            // Cek setiap warga untuk tanggal ini
            dataRows.forEach((row, rowIndex) => {
                const namaWarga = row[0]; // Nama dari kolom pertama
                const statusRonda = row[colIndex + 1]; // Status ronda di tanggal tertentu (+1 karena kolom pertama adalah nama)
                
                // Jika TRUE atau ada nilai tertentu (sesuaikan dengan format data Anda)
                if (statusRonda && statusRonda.toString().toUpperCase() === 'TRUE') {
                    wargaBertugas.push(`${rowIndex + 1}. ${namaWarga}`);
                }
            });
            
            // Hanya tambahkan jika ada warga yang bertugas di tanggal ini
            if (wargaBertugas.length > 0) {
                jadwalPerTanggal.push({
                    tanggal: tanggal,
                    warga: wargaBertugas
                });
            }
        });
        
        let currentY = 40;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        
        // Jika tidak ada data jadwal
        if (jadwalPerTanggal.length === 0) {
            doc.setFontSize(14);
            doc.text("Tidak ada data jadwal ronda yang ditemukan.", margin, currentY);
            currentY += 20;
        } else {
            // Tampilkan jadwal per tanggal
            jadwalPerTanggal.forEach((jadwal, index) => {
                // Cek jika perlu halaman baru
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }
                
                // Format tanggal lebih baik
                let formattedDate = jadwal.tanggal;
                try {
                    // Coba parsing tanggal jika dalam format tertentu
                    const dateMoment = moment(jadwal.tanggal, 'DD/MM/YYYY');
                    if (dateMoment.isValid()) {
                        formattedDate = dateMoment.format('DD MMMM YYYY');
                    }
                } catch (e) {
                    // Jika gagal parsing, gunakan tanggal asli
                }
                
                // Judul tanggal
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(`Jadwal Ronda ${formattedDate}:`, margin, currentY);
                currentY += 8;
                
                // List warga yang bertugas
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                
                jadwal.warga.forEach((namaWarga, idx) => {
                    doc.text(namaWarga, margin + 10, currentY);
                    currentY += 7;
                });
                
                currentY += 10; // Spasi antar tanggal
            });
        }
        
        // Footer
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text(`Total ${jadwalPerTanggal.length} hari jadwal ronda tercatat`, 105, 280, { align: 'center' });
        doc.text(`© E-MURAI ${new Date().getFullYear()}`, 105, 285, { align: 'center' });
        
        // Simpan file
        doc.save(`Jadwal_Ronda_EMurai_${moment().format('YYYYMMDD')}.pdf`);
        
    } catch (err) { 
        console.error("Error generating PDF:", err);
        alert("Gagal membuat PDF: " + err.message); 
    }
    finally { 
        showLoading(false); 
    }
}
