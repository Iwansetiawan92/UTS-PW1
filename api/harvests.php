<?php
// API data panen. Satu file menangani GET dan POST,
// method lain ditolak dengan 405.

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/database.php';

// Mengirim respons JSON dengan status code, lalu menghentikan script.
function sendResponse($statusCode, $success, $message, $data = null)
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Membaca body JSON dari request. Body kosong dianggap array kosong.
function readJsonBody()
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

// Memvalidasi input panen. Mengembalikan pesan error,
// atau null jika semua input valid.
function validateHarvestInput($pdo, $data)
{
    $farmerId = $data['farmer_id'] ?? null;
    $harvestDate = isset($data['harvest_date']) ? trim($data['harvest_date']) : '';
    $quantityKg = $data['quantity_kg'] ?? null;

    if (!filter_var($farmerId, FILTER_VALIDATE_INT) || (int)$farmerId <= 0) {
        return 'Petani wajib dipilih.';
    }

    // Pastikan petani benar-benar ada sebelum menyimpan relasi.
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM farmers WHERE id = ?');
    $stmt->execute([(int)$farmerId]);

    if ((int)$stmt->fetchColumn() === 0) {
        return 'Data petani tidak ditemukan.';
    }

    // checkdate memastikan tanggal benar-benar ada di kalender.
    $dateParts = explode('-', $harvestDate);

    if (count($dateParts) !== 3
        || !checkdate((int)$dateParts[1], (int)$dateParts[2], (int)$dateParts[0])) {
        return 'Tanggal panen wajib diisi dengan format tanggal yang valid.';
    }

    if (!is_numeric($quantityKg) || (float)$quantityKg <= 0) {
        return 'Jumlah panen harus berupa angka lebih besar dari nol.';
    }

    return null;
}

// Mengambil satu catatan panen (JOIN petani) berdasarkan id panen.
function findHarvestById($pdo, $id)
{
    $stmt = $pdo->prepare(
        'SELECT h.id, h.farmer_id, f.farmer_id AS farmer_code, f.name AS farmer_name,
                h.harvest_date, h.quantity_kg
         FROM harvests h
         JOIN farmers f ON f.id = h.farmer_id
         WHERE h.id = ?'
    );
    $stmt->execute([$id]);

    return $stmt->fetch();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // JOIN dipakai agar nama dan kode petani ikut tampil tanpa query tambahan.
            $stmt = $pdo->query(
                'SELECT h.id, h.farmer_id, f.farmer_id AS farmer_code, f.name AS farmer_name,
                        h.harvest_date, h.quantity_kg
                 FROM harvests h
                 JOIN farmers f ON f.id = h.farmer_id
                 ORDER BY h.harvest_date DESC, h.id DESC'
            );

            sendResponse(200, true, 'Data panen berhasil diambil.', $stmt->fetchAll());
            break;

        case 'POST':
            $data = readJsonBody();
            $error = validateHarvestInput($pdo, $data);

            if ($error !== null) {
                sendResponse(400, false, $error);
            }

            $farmerId = (int)$data['farmer_id'];
            $harvestDate = trim($data['harvest_date']);
            $quantityKg = (float)$data['quantity_kg'];

            $stmt = $pdo->prepare(
                'INSERT INTO harvests (farmer_id, harvest_date, quantity_kg)
                 VALUES (?, ?, ?)'
            );
            $stmt->execute([$farmerId, $harvestDate, $quantityKg]);

            $harvest = findHarvestById($pdo, (int)$pdo->lastInsertId());

            sendResponse(201, true, 'Data panen berhasil ditambahkan.', $harvest);
            break;

        default:
            sendResponse(405, false, 'Metode HTTP tidak didukung.');
    }
} catch (PDOException $e) {
    // Detail teknis hanya masuk log server, tidak dikirim ke pengguna.
    error_log($e->getMessage());
    sendResponse(500, false, 'Terjadi kesalahan pada server.');
}
