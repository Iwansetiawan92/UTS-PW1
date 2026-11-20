// Alamat API yang dipakai frontend.
const API_URL = 'api/farmers.php';
const HARVEST_API_URL = 'api/harvests.php';

// Data petani hasil pencarian, dipakai untuk tabel.
let farmersData = [];

// Semua petani tanpa filter. Dipakai grafik dan pilihan petani pada form panen
// agar tetap lengkap walaupun tabel sedang menampilkan hasil pencarian.
let allFarmers = [];

// Menyimpan id internal database saat form berada di mode edit.
// Bernilai null berarti form sedang dalam mode tambah data.
let editingId = null;

// Mengambil data petani dari API. Parameter search diisi saat mencari by name.
async function loadFarmers(search = '') {
    let url = API_URL;

    // encodeURIComponent membuat karakter khusus aman dikirim lewat URL.
    if (search !== '') {
        url = API_URL + '?search=' + encodeURIComponent(search);
    }

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Data petani gagal diambil.');
        }

        farmersData = result.data;

        // Tanpa pencarian, hasil API juga berisi seluruh petani.
        if (search === '') {
            allFarmers = result.data;
            fillFarmerSelect();
        }

        renderTable();
        renderLandChart();
    } catch (error) {
        // Server mati atau respons bukan JSON yang valid juga masuk ke sini.
        farmersData = [];
        renderTable();

        if (search === '') {
            allFarmers = [];
            fillFarmerSelect();
            renderLandChart();
        }

        showAlert('Gagal mengambil data petani. Periksa koneksi dan server.', true);
    }
}

// Mengisi pilihan petani pada form panen. value = id internal database
// karena tabel harvests menyimpan farmer_id dalam bentuk id internal.
function fillFarmerSelect() {
    const select = document.getElementById('panenPetani');
    select.innerHTML = '';

    if (allFarmers.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Belum ada data petani.';
        select.appendChild(option);
        return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih petani';
    select.appendChild(placeholder);

    allFarmers.forEach(farmer => {
        const option = document.createElement('option');
        option.value = farmer.id;
        option.textContent = farmer.farmer_id + ' - ' + farmer.name;
        select.appendChild(option);
    });
}

// Menampilkan daftar petani ke tabel. Nilai dari database dimasukkan
// lewat textContent agar tidak dieksekusi sebagai HTML (mencegah XSS).
function renderTable() {
    const tbody = document.getElementById('farmerTableBody');
    tbody.innerHTML = '';

    if (farmersData.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.className = 'empty-state';
        cell.textContent = 'Belum ada data petani.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    farmersData.forEach((farmer, index) => {
        const row = document.createElement('tr');

        // Nomor urut dan ID petani (farmer_id, bukan id internal database).
        row.appendChild(createCell(index + 1));
        row.appendChild(createCell(farmer.farmer_id));
        row.appendChild(createCell(farmer.name));
        row.appendChild(createCell(farmer.address || '-'));
        row.appendChild(createCell(farmer.land_area + ' Ha', 'numeric'));

        // Tombol aksi menyimpan id internal database pada atribut data-id.
        const actionCell = document.createElement('td');
        actionCell.className = 'actions';
        actionCell.appendChild(createActionButton('Edit', 'btn-edit', farmer.id));
        actionCell.appendChild(createActionButton('Hapus', 'btn-danger', farmer.id));
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
}

// Membuat satu sel tabel berisi teks biasa. Class opsional dipakai
// untuk meratakan angka ke kanan (numeric).
function createCell(text, className = '') {
    const cell = document.createElement('td');
    cell.textContent = text;

    if (className !== '') {
        cell.className = className;
    }

    return cell;
}

// Membuat tombol aksi dengan id internal database di atribut data-id.
function createActionButton(label, className, id) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.dataset.id = id;
    return button;
}

// Menampilkan notifikasi sementara. Pesan kesalahan memakai warna bahaya.
function showAlert(message, isError = false) {
    const alertBox = document.getElementById('alertSuccess');
    alertBox.textContent = message;
    alertBox.classList.toggle('alert-error', isError);
    alertBox.classList.toggle('alert-success', !isError);
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 3000);
}

// Membuat grafik batang dari data. Tinggi batang dihitung relatif
// terhadap nilai terbesar agar perbandingan antar petani terlihat jelas.
function renderLandChart() {
    const container = document.getElementById('landChart');
    container.innerHTML = '';

    if (allFarmers.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Belum ada data petani. Tambahkan data untuk melihat grafik.';
        container.appendChild(empty);
        return;
    }

    const maxLand = Math.max(...allFarmers.map(farmer => Number(farmer.land_area)));

    allFarmers.forEach(farmer => {
        const item = document.createElement('div');
        item.className = 'bar-item';

        // Batang minimal 5% agar petani dengan lahan kecil tetap terlihat.
        const height = Math.max((Number(farmer.land_area) / maxLand) * 100, 5);

        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = farmer.land_area + ' Ha';

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = height + '%';

        // Nilai diletakkan di dalam batang dan diposisikan mengambang
        // di atasnya lewat CSS, sehingga tinggi batang tetap akurat.
        bar.appendChild(value);

        // Area batang punya tinggi tetap di CSS, sehingga persentase tinggi
        // batang dihitung terhadap area ini, bukan terhadap seluruh kartu.
        const barArea = document.createElement('div');
        barArea.className = 'bar-area';
        barArea.appendChild(bar);

        const label = document.createElement('span');
        label.className = 'bar-label';
        label.textContent = farmer.name;

        item.appendChild(barArea);
        item.appendChild(label);
        container.appendChild(item);
    });

    const caption = document.createElement('p');
    caption.className = 'chart-caption';
    caption.textContent = 'Satuan: hektare (Ha). Tinggi batang dibandingkan dengan luas lahan terbesar.';
    container.appendChild(caption);
}

// Mengubah form kembali ke mode tambah data.
function resetForm() {
    editingId = null;
    document.getElementById('farmerForm').reset();
    document.getElementById('submitButton').textContent = 'Simpan Data';
    document.getElementById('cancelButton').hidden = true;
}

// Mengisi form dengan data petani yang dipilih dan mengaktifkan mode edit.
function startEdit(id) {
    const farmer = allFarmers.find(item => Number(item.id) === Number(id));

    if (!farmer) {
        showAlert('Data petani tidak ditemukan.', true);
        return;
    }

    editingId = farmer.id;
    document.getElementById('namaPetani').value = farmer.name;
    document.getElementById('idPetani').value = farmer.farmer_id;
    document.getElementById('alamat').value = farmer.address || '';
    document.getElementById('luasLahan').value = farmer.land_area;
    document.getElementById('submitButton').textContent = 'Perbarui Data';
    document.getElementById('cancelButton').hidden = false;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Menangani submit form untuk menambah (POST) atau memperbarui (PUT) data.
document.getElementById('farmerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('namaPetani').value.trim();
    const farmerId = document.getElementById('idPetani').value.trim();
    const address = document.getElementById('alamat').value.trim();
    const landArea = parseFloat(document.getElementById('luasLahan').value);

    if (!name || !farmerId) {
        alert('Peringatan: Nama Petani dan NIK/ID Petani wajib diisi!');
        return;
    }

    if (isNaN(landArea) || landArea <= 0) {
        alert('Peringatan: Luas lahan harus berupa angka yang valid!');
        return;
    }

    const body = JSON.stringify({
        farmer_id: farmerId,
        name: name,
        address: address,
        land_area: landArea
    });

    // PUT butuh id internal database di URL, POST tidak.
    let url = API_URL;
    let method = 'POST';

    if (editingId !== null) {
        url = API_URL + '?id=' + encodeURIComponent(editingId);
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            // Pesan dari API dipakai agar pengguna tahu penyebabnya,
            // misalnya ID petani duplikat atau input tidak valid.
            showAlert(result.message || 'Data petani gagal disimpan.', true);
            return;
        }

        const wasEditing = editingId !== null;
        resetForm();

        // Kosongkan pencarian agar data baru atau hasil edit langsung terlihat.
        document.getElementById('searchInput').value = '';
        await loadFarmers();
        showAlert(wasEditing
            ? 'Data petani berhasil diperbarui.'
            : 'Data petani berhasil ditambahkan.');
    } catch (error) {
        showAlert('Gagal menghubungi server. Periksa koneksi Anda.', true);
    }
});

// Tombol Batal membatalkan mode edit tanpa mengirim data ke server.
document.getElementById('cancelButton').addEventListener('click', function() {
    resetForm();
});

// Event delegation: satu listener di tabel menangani tombol Edit dan Hapus,
// termasuk tombol yang baru dibuat setelah data dimuat dari API.
document.getElementById('farmerTableBody').addEventListener('click', async function(e) {
    const id = e.target.dataset.id;
    const isEdit = e.target.classList.contains('btn-edit');
    const isDelete = e.target.classList.contains('btn-danger');

    if (isEdit) {
        startEdit(id);
        return;
    }

    if (!isDelete) {
        return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus data petani ini?')) {
        return;
    }

    try {
        const response = await fetch(API_URL + '?id=' + encodeURIComponent(id), {
            method: 'DELETE'
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            showAlert(result.message || 'Data petani gagal dihapus.', true);
            return;
        }

        // Jika petani yang sedang diedit dihapus, form kembali ke mode tambah.
        if (editingId !== null && Number(editingId) === Number(id)) {
            resetForm();
        }

        // Kosongkan pencarian agar loadFarmers() memuat ulang seluruh data.
        // Dengan begitu allFarmers, tabel, grafik luas lahan, dan pilihan
        // petani pada form panen ikut diperbarui.
        document.getElementById('searchInput').value = '';
        await loadFarmers();

        // Catatan panen petani ini ikut terhapus lewat ON DELETE CASCADE,
        // jadi tabel dan grafik panen harus diambil ulang.
        await loadHarvests();

        showAlert('Data petani berhasil dihapus.');
    } catch (error) {
        showAlert('Gagal menghubungi server. Periksa koneksi Anda.', true);
    }
});

// Pencarian memakai API setiap kali pengguna mengetik.
document.getElementById('searchInput').addEventListener('input', function(e) {
    loadFarmers(e.target.value.trim());
});

// Data panen terakhir dari API, dipakai untuk tabel dan grafik panen.
let harvestsData = [];

// Mengambil data panen dari API, lalu membarui tabel dan grafik panen.
async function loadHarvests() {
    try {
        const response = await fetch(HARVEST_API_URL);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Data panen gagal diambil.');
        }

        harvestsData = result.data;
        renderHarvestTable();
        renderHarvestChart();
    } catch (error) {
        harvestsData = [];
        renderHarvestTable();
        renderHarvestChart();
        showAlert('Gagal mengambil data panen. Periksa koneksi dan server.', true);
    }
}

// Menampilkan catatan panen ke tabel. Data dari API dimasukkan lewat
// textContent agar aman dari eksekusi HTML.
function renderHarvestTable() {
    const tbody = document.getElementById('harvestTableBody');
    tbody.innerHTML = '';

    if (harvestsData.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'empty-state';
        cell.textContent = 'Belum ada data panen.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    harvestsData.forEach((harvest, index) => {
        const row = document.createElement('tr');
        row.appendChild(createCell(index + 1));
        row.appendChild(createCell(harvest.farmer_code));
        row.appendChild(createCell(harvest.farmer_name));
        row.appendChild(createCell(harvest.harvest_date));
        row.appendChild(createCell(harvest.quantity_kg + ' kg', 'numeric'));
        tbody.appendChild(row);
    });
}

// Membuat grafik batang horizontal dari total panen per petani.
function renderHarvestChart() {
    const container = document.getElementById('harvestChart');
    container.innerHTML = '';

    if (harvestsData.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Belum ada data hasil panen. Grafik akan tampil setelah data panen dicatat.';
        container.appendChild(empty);
        return;
    }

    // Jumlahkan quantity_kg untuk setiap farmer_id (id internal database).
    const totals = {};

    harvestsData.forEach(harvest => {
        const key = harvest.farmer_id;
        const name = harvest.farmer_name;
        const quantity = Number(harvest.quantity_kg);

        if (totals[key]) {
            totals[key].quantity += quantity;
        } else {
            totals[key] = { name: name, quantity: quantity };
        }
    });

    const rows = Object.values(totals);
    const maxQuantity = Math.max(...rows.map(row => row.quantity));

    rows.forEach(row => {
        const hbarRow = document.createElement('div');
        hbarRow.className = 'hbar-row';

        const name = document.createElement('span');
        name.className = 'hbar-name';
        name.textContent = row.name;

        const track = document.createElement('div');
        track.className = 'hbar-track';

        const fill = document.createElement('div');
        fill.className = 'hbar-fill';
        // Lebar minimal 2% agar petani dengan total kecil tetap terlihat.
        fill.style.width = Math.max((row.quantity / maxQuantity) * 100, 2) + '%';

        const value = document.createElement('span');
        value.className = 'hbar-value';
        value.textContent = row.quantity.toFixed(2) + ' kg';

        track.appendChild(fill);
        hbarRow.appendChild(name);
        hbarRow.appendChild(track);
        hbarRow.appendChild(value);
        container.appendChild(hbarRow);
    });

    const caption = document.createElement('p');
    caption.className = 'chart-caption';
    caption.textContent = 'Satuan: kilogram (kg). Batang menunjukkan total panen setiap petani.';
    container.appendChild(caption);
}

// Menangani submit form panen: validasi, kirim POST, lalu muat ulang data.
document.getElementById('harvestForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const farmerId = document.getElementById('panenPetani').value;
    const harvestDate = document.getElementById('tanggalPanen').value;
    const quantityKg = parseFloat(document.getElementById('jumlahPanen').value);

    if (!farmerId) {
        alert('Peringatan: Pilih petani terlebih dahulu!');
        return;
    }

    if (!harvestDate) {
        alert('Peringatan: Tanggal panen wajib diisi!');
        return;
    }

    if (isNaN(quantityKg) || quantityKg <= 0) {
        alert('Peringatan: Jumlah panen harus berupa angka lebih besar dari nol!');
        return;
    }

    try {
        const response = await fetch(HARVEST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                farmer_id: Number(farmerId),
                harvest_date: harvestDate,
                quantity_kg: quantityKg
            })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            showAlert(result.message || 'Data panen gagal disimpan.', true);
            return;
        }

        document.getElementById('harvestForm').reset();
        await loadHarvests();
        showAlert('Data panen berhasil ditambahkan.');
    } catch (error) {
        showAlert('Gagal menghubungi server. Periksa koneksi Anda.', true);
    }
});

// Ambil data awal saat halaman dibuka.
window.onload = function() {
    loadFarmers();
    loadHarvests();
};
