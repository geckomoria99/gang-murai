// Global variables
let isAdmin = false;
let scriptUrl = 'https://script.google.com/macros/s/AKfycbyamytGZ4HZXJFOfQ9r1pTrWGDLJL8yBbVQvpy72Dl0qkHNi_zPxF3R6ULhQel7hgTU/exec'; // Will be set after deployment

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const guestBtn = document.getElementById('guestBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginBtn = document.getElementById('loginBtn');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const passwordInput = document.getElementById('password');
const userRole = document.getElementById('userRole');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.querySelector('.modal-body');
const closeModalBtn = document.getElementById('closeModalBtn');
const loadingIndicator = document.getElementById('loadingIndicator');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Page specific elements
const pengumumanList = document.getElementById('pengumumanList');
const addPengumumanBtn = document.getElementById('addPengumumanBtn');
const iuranTable = document.getElementById('iuranTable');
const kasContainer = document.getElementById('kasContainer');
const addTransaksiBtn = document.getElementById('addTransaksiBtn');
const rondaTable = document.getElementById('rondaTable');

// Admin only elements
const adminOnlyElements = document.querySelectorAll('.admin-only');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set script URL (replace with your deployed script URL)
    scriptUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    
    // Event listeners
    guestBtn.addEventListener('click', loginAsGuest);
    adminLoginBtn.addEventListener('click', showAdminLoginForm);
    cancelLoginBtn.addEventListener('click', hideAdminLoginForm);
    loginBtn.addEventListener('click', loginAsAdmin);
    logoutBtn.addEventListener('click', logout);
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageName = this.getAttribute('data-page');
            switchPage(pageName);
        });
    });
    
    // Page specific event listeners
    addPengumumanBtn.addEventListener('click', showAddPengumumanModal);
    addTransaksiBtn.addEventListener('click', showAddTransaksiModal);
});

// Login functions
function loginAsGuest() {
    isAdmin = false;
    userRole.textContent = 'Guest';
    showMainScreen();
    loadInitialData();
}

function showAdminLoginForm() {
    adminLoginForm.classList.remove('hidden');
    passwordInput.focus();
}

function hideAdminLoginForm() {
    adminLoginForm.classList.add('hidden');
    passwordInput.value = '';
}

function loginAsAdmin() {
    const password = passwordInput.value;
    
    if (!password) {
        showToast('Password tidak boleh kosong', 'error');
        return;
    }
    
    showLoading(true);
    
    // Call API to validate login
    callApi('validateLogin', { password })
        .then(response => {
            if (response.valid) {
                isAdmin = true;
                userRole.textContent = 'Admin';
                showMainScreen();
                loadInitialData();
                showToast('Login berhasil', 'success');
            } else {
                showToast('Password salah', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
            hideAdminLoginForm();
        });
}

function logout() {
    isAdmin = false;
    userRole.textContent = 'Guest';
    hideMainScreen();
    showToast('Anda telah logout', 'info');
}

function showMainScreen() {
    loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    
    // Show/hide admin-only elements
    adminOnlyElements.forEach(element => {
        if (isAdmin) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

function hideMainScreen() {
    mainScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
}

// Navigation
function switchPage(pageName) {
    // Update nav items
    navItems.forEach(item => {
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update pages
    pages.forEach(page => {
        if (page.id === `${pageName}Page`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    
    // Load page data
    loadPageData(pageName);
}

// Load initial data
function loadInitialData() {
    loadPageData('pengumuman');
}

// Load page data
function loadPageData(pageName) {
    showLoading(true);
    
    switch (pageName) {
        case 'pengumuman':
            loadPengumuman();
            break;
        case 'iuran':
            loadIuranBulanan();
            break;
        case 'kas':
            loadUangKas();
            break;
        case 'ronda':
            loadJadwalRonda();
            break;
    }
}

// API call function
function callApi(action, params = {}) {
    return new Promise((resolve, reject) => {
        const url = `${scriptUrl}?action=${action}`;
        const formData = new FormData();
        
        // Add all params to formData
        Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
        });
        
        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                resolve(data);
            } else {
                reject(new Error(data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

// Show/hide loading
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Modal functions
function showModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

// Pengumuman functions
function loadPengumuman() {
    callApi('getPengumuman')
        .then(response => {
            renderPengumuman(response.data);
        })
        .catch(error => {
            showToast('Gagal memuat data pengumuman: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderPengumuman(data) {
    pengumumanList.innerHTML = '';
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
        const [id, tanggal, judul, isi, pengirim] = data[i];
        
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${judul}</h3>
                <span class="card-date">${moment(tanggal).format('DD MMMM YYYY')}</span>
            </div>
            <div class="card-content">
                <p>${isi}</p>
            </div>
            <div class="card-footer">
                <span>Oleh: ${pengirim}</span>
                ${isAdmin ? `
                    <div class="btn-group">
                        <button class="btn btn-small btn-icon edit-pengumuman" data-id="${id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-icon delete-pengumuman" data-id="${id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        pengumumanList.appendChild(card);
    }
    
    // Add event listeners for admin buttons
    if (isAdmin) {
        document.querySelectorAll('.edit-pengumuman').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                showEditPengumumanModal(id);
            });
        });
        
        document.querySelectorAll('.delete-pengumuman').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
                    deletePengumuman(id);
                }
            });
        });
    }
}

function showAddPengumumanModal() {
    const content = `
        <form id="pengumumanForm">
            <div class="form-group">
                <label for="tanggal">Tanggal</label>
                <input type="date" id="tanggal" value="${moment().format('YYYY-MM-DD')}" required>
            </div>
            <div class="form-group">
                <label for="judul">Judul</label>
                <input type="text" id="judul" placeholder="Judul pengumuman" required>
            </div>
            <div class="form-group">
                <label for="isi">Isi Pengumuman</label>
                <textarea id="isi" rows="5" placeholder="Isi pengumuman" required></textarea>
            </div>
            <div class="form-group">
                <label for="pengirim">Pengirim</label>
                <input type="text" id="pengirim" placeholder="Nama pengirim" required>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary">Simpan</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
            </div>
        </form>
    `;
    
    showModal('Tambah Pengumuman', content);
    
    // Add form submit event listener
    document.getElementById('pengumumanForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById('tanggal').value;
        const judul = document.getElementById('judul').value;
        const isi = document.getElementById('isi').value;
        const pengirim = document.getElementById('pengirim').value;
        
        addPengumuman(tanggal, judul, isi, pengirim);
    });
}

function showEditPengumumanModal(id) {
    // Get pengumuman data by ID
    callApi('getPengumuman')
        .then(response => {
            const data = response.data;
            
            // Find the pengumuman with the given ID
            let pengumuman = null;
            for (let i = 1; i < data.length; i++) {
                if (data[i][0] == id) {
                    pengumuman = {
                        id: data[i][0],
                        tanggal: data[i][1],
                        judul: data[i][2],
                        isi: data[i][3],
                        pengirim: data[i][4]
                    };
                    break;
                }
            }
            
            if (!pengumuman) {
                showToast('Pengumuman tidak ditemukan', 'error');
                return;
            }
            
            const content = `
                <form id="pengumumanForm">
                    <input type="hidden" id="id" value="${pengumuman.id}">
                    <div class="form-group">
                        <label for="tanggal">Tanggal</label>
                        <input type="date" id="tanggal" value="${pengumuman.tanggal}" required>
                    </div>
                    <div class="form-group">
                        <label for="judul">Judul</label>
                        <input type="text" id="judul" value="${pengumuman.judul}" required>
                    </div>
                    <div class="form-group">
                        <label for="isi">Isi Pengumuman</label>
                        <textarea id="isi" rows="5" required>${pengumuman.isi}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="pengirim">Pengirim</label>
                        <input type="text" id="pengirim" value="${pengumuman.pengirim}" required>
                    </div>
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">Simpan</button>
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    </div>
                </form>
            `;
            
            showModal('Edit Pengumuman', content);
            
            // Add form submit event listener
            document.getElementById('pengumumanForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const id = document.getElementById('id').value;
                const tanggal = document.getElementById('tanggal').value;
                const judul = document.getElementById('judul').value;
                const isi = document.getElementById('isi').value;
                const pengirim = document.getElementById('pengirim').value;
                
                editPengumuman(id, tanggal, judul, isi, pengirim);
            });
        })
        .catch(error => {
            showToast('Gagal memuat data pengumuman: ' + error.message, 'error');
        });
}

function addPengumuman(tanggal, judul, isi, pengirim) {
    showLoading(true);
    
    callApi('addPengumuman', { tanggal, judul, isi, pengirim })
        .then(response => {
            if (response.success) {
                closeModal();
                loadPengumuman();
                showToast('Pengumuman berhasil ditambahkan', 'success');
            } else {
                showToast('Gagal menambahkan pengumuman', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function editPengumuman(id, tanggal, judul, isi, pengirim) {
    showLoading(true);
    
    callApi('editPengumuman', { id, tanggal, judul, isi, pengirim })
        .then(response => {
            if (response.success) {
                closeModal();
                loadPengumuman();
                showToast('Pengumuman berhasil diperbarui', 'success');
            } else {
                showToast('Gagal memperbarui pengumuman', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function deletePengumuman(id) {
    showLoading(true);
    
    callApi('deletePengumuman', { id })
        .then(response => {
            if (response.success) {
                loadPengumuman();
                showToast('Pengumuman berhasil dihapus', 'success');
            } else {
                showToast('Gagal menghapus pengumuman', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Iuran Bulanan functions
function loadIuranBulanan() {
    callApi('getIuranBulanan')
        .then(response => {
            renderIuranBulanan(response.data);
        })
        .catch(error => {
            showToast('Gagal memuat data iuran bulanan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderIuranBulanan(data) {
    if (data.length === 0) {
        iuranTable.innerHTML = '<tr><td colspan="100%">Tidak ada data</td></tr>';
        return;
    }
    
    // Create table header
    let html = '<thead><tr><th>Nama Warga</th>';
    
    // Add month headers (skip first column which is name)
    for (let i = 1; i < data[0].length; i++) {
        html += `<th>${data[0][i]}</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    // Add table rows
    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        
        // Add name
        html += `<td>${data[i][0]}</td>`;
        
        // Add month checkboxes
        for (let j = 1; j < data[i].length; j++) {
            const month = data[0][j];
            const checked = data[i][j] === true ? 'checked' : '';
            
            if (isAdmin) {
                html += `
                    <td class="checkbox-container">
                        <input type="checkbox" 
                               class="iuran-checkbox" 
                               data-nama="${data[i][0]}" 
                               data-bulan="${month}" 
                               ${checked}>
                    </td>
                `;
            } else {
                html += `
                    <td class="checkbox-container">
                        <input type="checkbox" ${checked} disabled>
                    </td>
                `;
            }
        }
        
        html += '</tr>';
    }
    
    html += '</tbody>';
    
    iuranTable.innerHTML = html;
    
    // Add event listeners for checkboxes if admin
    if (isAdmin) {
        document.querySelectorAll('.iuran-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const nama = this.getAttribute('data-nama');
                const bulan = this.getAttribute('data-bulan');
                const status = this.checked;
                
                updateIuranStatus(nama, bulan, status);
            });
        });
    }
}

function updateIuranStatus(namaWarga, bulan, status) {
    showLoading(true);
    
    callApi('updateIuranStatus', { namaWarga, bulan, status })
        .then(response => {
            if (response.success) {
                showToast('Status iuran berhasil diperbarui', 'success');
            } else {
                showToast('Gagal memperbarui status iuran', 'error');
                // Reload data to revert change
                loadIuranBulanan();
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
            // Reload data to revert change
            loadIuranBulanan();
        })
        .finally(() => {
            showLoading(false);
        });
}

// Uang Kas functions
function loadUangKas() {
    callApi('getUangKas')
        .then(response => {
            renderUangKas(response.data);
        })
        .catch(error => {
            showToast('Gagal memuat data uang kas: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderUangKas(data) {
    kasContainer.innerHTML = '';
    
    if (data.length === 0) {
        kasContainer.innerHTML = '<p>Tidak ada data</p>';
        return;
    }
    
    // Group transactions by month
    const transactionsByMonth = {};
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
        const [id, bulan, tanggal, keterangan, pemasukan, pengeluaran] = data[i];
        
        if (!transactionsByMonth[bulan]) {
            transactionsByMonth[bulan] = [];
        }
        
        transactionsByMonth[bulan].push({
            id,
            bulan,
            tanggal,
            keterangan,
            pemasukan: parseInt(pemasukan) || 0,
            pengeluaran: parseInt(pengeluaran) || 0
        });
    }
    
    // Create a table for each month
    Object.keys(transactionsByMonth).sort().forEach(bulan => {
        const transactions = transactionsByMonth[bulan];
        
        // Calculate previous month balance
        let previousBalance = 0;
        const months = Object.keys(transactionsByMonth).sort();
        const currentIndex = months.indexOf(bulan);
        
        if (currentIndex > 0) {
            const previousMonth = months[currentIndex - 1];
            const previousTransactions = transactionsByMonth[previousMonth];
            
            let balance = 0;
            previousTransactions.forEach(transaction => {
                balance += transaction.pemasukan - transaction.pengeluaran;
            });
            
            previousBalance = balance;
        }
        
        // Create month container
        const monthContainer = document.createElement('div');
        monthContainer.className = 'mb-20';
        
        // Create month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'card-header mb-10';
        monthHeader.innerHTML = `
            <h3>${bulan}</h3>
            <span>Saldo Awal: Rp ${formatNumber(previousBalance)}</span>
        `;
        
        // Create table
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create table header
        let tableHtml = `
            <thead>
                <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Saldo</th>
                    ${isAdmin ? '<th>Aksi</th>' : ''}
                </tr>
            </thead>
            <tbody>
        `;
        
        // Add transactions
        let balance = previousBalance;
        
        transactions.forEach((transaction, index) => {
            balance += transaction.pemasukan - transaction.pengeluaran;
            
            tableHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${moment(transaction.tanggal).format('DD/MM/YYYY')}</td>
                    <td>${transaction.keterangan}</td>
                    <td class="text-right">Rp ${formatNumber(transaction.pemasukan)}</td>
                    <td class="text-right">Rp ${formatNumber(transaction.pengeluaran)}</td>
                    <td class="text-right">Rp ${formatNumber(balance)}</td>
                    ${isAdmin ? `
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-small btn-icon edit-transaksi" data-id="${transaction.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-small btn-icon delete-transaksi" data-id="${transaction.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    ` : ''}
                </tr>
            `;
        });
        
        // Add final balance row
        tableHtml += `
            <tr class="font-weight-bold">
                <td colspan="3">Saldo Akhir</td>
                <td colspan="3" class="text-right">Rp ${formatNumber(balance)}</td>
                ${isAdmin ? '<td></td>' : ''}
            </tr>
        `;
        
        tableHtml += '</tbody>';
        
        table.innerHTML = tableHtml;
        
        // Add to container
        monthContainer.appendChild(monthHeader);
        monthContainer.appendChild(table);
        kasContainer.appendChild(monthContainer);
    });
    
    // Add event listeners for admin buttons
    if (isAdmin) {
        document.querySelectorAll('.edit-transaksi').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                showEditTransaksiModal(id);
            });
        });
        
        document.querySelectorAll('.delete-transaksi').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
                    deleteTransaksi(id);
                }
            });
        });
    }
}

function showAddTransaksiModal() {
    const content = `
        <form id="transaksiForm">
            <div class="form-group">
                <label for="bulan">Bulan</label>
                <select id="bulan" required>
                    <option value="">Pilih bulan</option>
                    <option value="Januari 2026">Januari 2026</option>
                    <option value="Februari 2026">Februari 2026</option>
                    <option value="Maret 2026">Maret 2026</option>
                    <option value="April 2026">April 2026</option>
                    <option value="Mei 2026">Mei 2026</option>
                    <option value="Juni 2026">Juni 2026</option>
                    <option value="Juli 2026">Juli 2026</option>
                    <option value="Agustus 2026">Agustus 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="Desember 2026">Desember 2026</option>
                </select>
            </div>
            <div class="form-group">
                <label for="tanggal">Tanggal</label>
                <input type="date" id="tanggal" value="${moment().format('YYYY-MM-DD')}" required>
            </div>
            <div class="form-group">
                <label for="keterangan">Keterangan</label>
                <input type="text" id="keterangan" placeholder="Keterangan transaksi" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="pemasukan">Pemasukan</label>
                    <input type="number" id="pemasukan" placeholder="0" min="0">
                </div>
                <div class="form-group">
                    <label for="pengeluaran">Pengeluaran</label>
                    <input type="number" id="pengeluaran" placeholder="0" min="0">
                </div>
            </div>
            <div class="btn-group">
                <button type="submit" class="btn btn-primary">Simpan</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
            </div>
        </form>
    `;
    
    showModal('Tambah Transaksi', content);
    
    // Add form submit event listener
    document.getElementById('transaksiForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const bulan = document.getElementById('bulan').value;
        const tanggal = document.getElementById('tanggal').value;
        const keterangan = document.getElementById('keterangan').value;
        const pemasukan = document.getElementById('pemasukan').value || 0;
        const pengeluaran = document.getElementById('pengeluaran').value || 0;
        
        addTransaksi(bulan, tanggal, keterangan, pemasukan, pengeluaran);
    });
}

function showEditTransaksiModal(id) {
    // Get transaksi data by ID
    callApi('getUangKas')
        .then(response => {
            const data = response.data;
            
            // Find the transaksi with the given ID
            let transaksi = null;
            for (let i = 1; i < data.length; i++) {
                if (data[i][0] == id) {
                    transaksi = {
                        id: data[i][0],
                        bulan: data[i][1],
                        tanggal: data[i][2],
                        keterangan: data[i][3],
                        pemasukan: data[i][4],
                        pengeluaran: data[i][5]
                    };
                    break;
                }
            }
            
            if (!transaksi) {
                showToast('Transaksi tidak ditemukan', 'error');
                return;
            }
            
            const content = `
                <form id="transaksiForm">
                    <input type="hidden" id="id" value="${transaksi.id}">
                    <div class="form-group">
                        <label for="bulan">Bulan</label>
                        <select id="bulan" required>
                            <option value="Januari 2026" ${transaksi.bulan === 'Januari 2026' ? 'selected' : ''}>Januari 2026</option>
                            <option value="Februari 2026" ${transaksi.bulan === 'Februari 2026' ? 'selected' : ''}>Februari 2026</option>
                            <option value="Maret 2026" ${transaksi.bulan === 'Maret 2026' ? 'selected' : ''}>Maret 2026</option>
                            <option value="April 2026" ${transaksi.bulan === 'April 2026' ? 'selected' : ''}>April 2026</option>
                            <option value="Mei 2026" ${transaksi.bulan === 'Mei 2026' ? 'selected' : ''}>Mei 2026</option>
                            <option value="Juni 2026" ${transaksi.bulan === 'Juni 2026' ? 'selected' : ''}>Juni 2026</option>
                            <option value="Juli 2026" ${transaksi.bulan === 'Juli 2026' ? 'selected' : ''}>Juli 2026</option>
                            <option value="Agustus 2026" ${transaksi.bulan === 'Agustus 2026' ? 'selected' : ''}>Agustus 2026</option>
                            <option value="September 2026" ${transaksi.bulan === 'September 2026' ? 'selected' : ''}>September 2026</option>
                            <option value="Oktober 2026" ${transaksi.bulan === 'Oktober 2026' ? 'selected' : ''}>Oktober 2026</option>
                            <option value="November 2026" ${transaksi.bulan === 'November 2026' ? 'selected' : ''}>November 2026</option>
                            <option value="Desember 2026" ${transaksi.bulan === 'Desember 2026' ? 'selected' : ''}>Desember 2026</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="tanggal">Tanggal</label>
                        <input type="date" id="tanggal" value="${transaksi.tanggal}" required>
                    </div>
                    <div class="form-group">
                        <label for="keterangan">Keterangan</label>
                        <input type="text" id="keterangan" value="${transaksi.keterangan}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="pemasukan">Pemasukan</label>
                            <input type="number" id="pemasukan" value="${transaksi.pemasukan}" min="0">
                        </div>
                        <div class="form-group">
                            <label for="pengeluaran">Pengeluaran</label>
                            <input type="number" id="pengeluaran" value="${transaksi.pengeluaran}" min="0">
                        </div>
                    </div>
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">Simpan</button>
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    </div>
                </form>
            `;
            
            showModal('Edit Transaksi', content);
            
            // Add form submit event listener
            document.getElementById('transaksiForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const id = document.getElementById('id').value;
                const bulan = document.getElementById('bulan').value;
                const tanggal = document.getElementById('tanggal').value;
                const keterangan = document.getElementById('keterangan').value;
                const pemasukan = document.getElementById('pemasukan').value || 0;
                const pengeluaran = document.getElementById('pengeluaran').value || 0;
                
                editTransaksi(id, bulan, tanggal, keterangan, pemasukan, pengeluaran);
            });
        })
        .catch(error => {
            showToast('Gagal memuat data transaksi: ' + error.message, 'error');
        });
}

function addTransaksi(bulan, tanggal, keterangan, pemasukan, pengeluaran) {
    showLoading(true);
    
    callApi('addTransaksiKas', { bulan, tanggal, keterangan, pemasukan, pengeluaran })
        .then(response => {
            if (response.success) {
                closeModal();
                loadUangKas();
                showToast('Transaksi berhasil ditambahkan', 'success');
            } else {
                showToast('Gagal menambahkan transaksi', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function editTransaksi(id, bulan, tanggal, keterangan, pemasukan, pengeluaran) {
    showLoading(true);
    
    callApi('editTransaksiKas', { id, bulan, tanggal, keterangan, pemasukan, pengeluaran })
        .then(response => {
            if (response.success) {
                closeModal();
                loadUangKas();
                showToast('Transaksi berhasil diperbarui', 'success');
            } else {
                showToast('Gagal memperbarui transaksi', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function deleteTransaksi(id) {
    showLoading(true);
    
    callApi('deleteTransaksiKas', { id })
        .then(response => {
            if (response.success) {
                loadUangKas();
                showToast('Transaksi berhasil dihapus', 'success');
            } else {
                showToast('Gagal menghapus transaksi', 'error');
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Jadwal Ronda functions
function loadJadwalRonda() {
    callApi('getJadwalRonda')
        .then(response => {
            renderJadwalRonda(response.data);
        })
        .catch(error => {
            showToast('Gagal memuat data jadwal ronda: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderJadwalRonda(data) {
    if (data.length === 0) {
        rondaTable.innerHTML = '<tr><td colspan="100%">Tidak ada data</td></tr>';
        return;
    }
    
    // Create table header
    let html = '<thead><tr><th>Nama Warga</th>';
    
    // Add date headers (skip first column which is name, and last two columns which are Terakhir Ronda and Remaining)
    for (let i = 1; i < data[0].length - 2; i++) {
        html += `<th>${data[0][i]}</th>`;
    }
    
    html += '<th>Terakhir Ronda</th><th>Remaining</th></tr></thead><tbody>';
    
    // Add table rows
    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        
        // Add name
        html += `<td>${data[i][0]}</td>`;
        
        // Add date checkboxes
        for (let j = 1; j < data[i].length - 2; j++) {
            const tanggal = data[0][j];
            const checked = data[i][j] === true ? 'checked' : '';
            
            if (isAdmin) {
                html += `
                    <td class="checkbox-container">
                        <input type="checkbox" 
                               class="ronda-checkbox" 
                               data-nama="${data[i][0]}" 
                               data-tanggal="${tanggal}" 
                               ${checked}>
                    </td>
                `;
            } else {
                html += `
                    <td class="checkbox-container">
                        <input type="checkbox" ${checked} disabled>
                    </td>
                `;
            }
        }
        
        // Add Terakhir Ronda and Remaining
        const terakhirRonda = data[i][data[i].length - 2] ? moment(data[i][data[i].length - 2]).format('DD/MM/YYYY') : '-';
        const remaining = data[i][data[i].length - 1] || 0;
        const remainingClass = remaining > 30 ? 'text-danger' : '';
        
        html += `
            <td>${terakhirRonda}</td>
            <td class="${remainingClass}">${remaining} hari</td>
        `;
        
        html += '</tr>';
    }
    
    html += '</tbody>';
    
    rondaTable.innerHTML = html;
    
    // Add event listeners for checkboxes if admin
    if (isAdmin) {
        document.querySelectorAll('.ronda-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const nama = this.getAttribute('data-nama');
                const tanggal = this.getAttribute('data-tanggal');
                const status = this.checked;
                
                updateRondaStatus(nama, tanggal, status);
            });
        });
    }
}

function updateRondaStatus(namaWarga, tanggal, status) {
    showLoading(true);
    
    callApi('updateRondaStatus', { namaWarga, tanggal, status })
        .then(response => {
            if (response.success) {
                showToast('Status ronda berhasil diperbarui', 'success');
            } else {
                showToast('Gagal memperbarui status ronda', 'error');
                // Reload data to revert change
                loadJadwalRonda();
            }
        })
        .catch(error => {
            showToast('Terjadi kesalahan: ' + error.message, 'error');
            // Reload data to revert change
            loadJadwalRonda();
        })
        .finally(() => {
            showLoading(false);
        });
}

// Utility function to format numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Add CSS for toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background-color: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    
    .toast-success {
        background-color: #28a745;
    }
    
    .toast-error {
        background-color: #dc3545;
    }
    
    .toast-info {
        background-color: #17a2b8;
    }
    
    .font-weight-bold {
        font-weight: 600;
    }
`;
document.head.appendChild(toastStyles);
