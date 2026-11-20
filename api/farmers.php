<?php
// API data petani. Satu file menangani semua operasi CRUD
// dengan membedakan HTTP method.

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

// Memvalidasi input petani. Mengembalikan pesan error,
// atau null jika semua input valid.
function validateFarmerInput($data)
{
    $farmerId = isset($data['farmer_id']) ? trim($data['farmer_id']) : '';
    $name = isset($data['name']) ? trim($data['name']) : '';
    $address = isset($data['address']) ? trim($data['address']) : '';
    $landArea = $data['land_area'] ?? null;

    // mb_strlen menghitung karakter, bukan byte. Bila ekstensi mbstring
    // tidak aktif, strlen dipakai sebagai cadangan agar tidak error fatal.
    $idLength = function_exists('mb_strlen') ? mb_strlen($farmerId) : strlen($farmerId);
    $nameLength = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);

    if ($farmerId === '') {
        return 'ID petani wajib diisi.';
    }

    // Batas panjang mengikuti ukuran kolom farmer_id VARCHAR(50).
    if ($idLength > 50) {
        return 'ID petani maksimal 50 karakter.';
    }

    if ($name === '') {
        return 'Nama petani wajib diisi.';
    }

    // Batas panjang mengikuti ukuran kolom name VARCHAR(100).
    if ($nameLength > 100) {
        return 'Nama petani maksimal 100 karakter.';
    }

    // is_numeric menerima angka dalam bentuk teks (misalnya "1.75").
    if (!is_numeric($landArea) || (float)$landArea <= 0) {
        return 'Luas lahan harus berupa angka lebih besar dari nol.';
    }

    return null;
}

// Mengambil satu baris petani berdasarkan primary key internal.
function findFarmerById($pdo, $id)
{
    $stmt = $pdo->prepare(
        'SELECT id, farmer_id, name, address, land_area FROM farmers WHERE id = ?'
    );
    $stmt->execute([$id]);

    return $stmt->fetch();
}

// Memeriksa apakah farmer_id sudah dipakai petani lain.
// Parameter $exceptId membuat UPDATE boleh memakai farmer_id milik sendiri.
function isFarmerIdTaken($pdo, $farmerId, $exceptId = 0)
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM farmers WHERE farmer_id = ? AND id <> ?'
    );
    $stmt->execute([$farmerId, $exceptId]);

    return (int)$stmt->fetchColumn() > 0;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Jika ada ?search=, filter hanya berdasarkan nama.
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';

            if ($search !== '') {
                // Tanda tanya pada SQL dipisahkan dari nilai input pengguna.
                // PDO mengirim nilai sebagai parameter, bukan menyambung string SQL.
                $stmt = $pdo->prepare(
                    'SELECT id, farmer_id, name, address, land_area
                     FROM farmers
                     WHERE name LIKE ?
                     ORDER BY id ASC'
                );
                $stmt->execute(['%' . $search . '%']);
            } else {
                $stmt = $pdo->query(
                    'SELECT id, farmer_id, name, address, land_area
                     FROM farmers
                     ORDER BY id ASC'
                );
            }

            sendResponse(200, true, 'Data petani berhasil diambil.', $stmt->fetchAll());
            break;

        case 'POST':
            $data = readJsonBody();
            $error = validateFarmerInput($data);

            if ($error !== null) {
                sendResponse(400, false, $error);
            }

            $farmerId = trim($data['farmer_id']);
            $name = trim($data['name']);
            $address = trim($data['address'] ?? '');
            $landArea = (float)$data['land_area'];

            if (isFarmerIdTaken($pdo, $farmerId)) {
                sendResponse(409, false, 'ID petani sudah digunakan. Gunakan ID lain.');
            }

            $stmt = $pdo->prepare(
                'INSERT INTO farmers (farmer_id, name, address, land_area)
                 VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$farmerId, $name, $address, $landArea]);

            $newId = (int)$pdo->lastInsertId();
            $farmer = findFarmerById($pdo, $newId);

            sendResponse(201, true, 'Data petani berhasil ditambahkan.', $farmer);
            break;

        case 'PUT':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($id <= 0) {
                sendResponse(400, false, 'Parameter id tidak valid.');
            }

            $data = readJsonBody();
            $error = validateFarmerInput($data);

            if ($error !== null) {
                sendResponse(400, false, $error);
            }

            if (!findFarmerById($pdo, $id)) {
                sendResponse(404, false, 'Data petani tidak ditemukan.');
            }

            $farmerId = trim($data['farmer_id']);
            $name = trim($data['name']);
            $address = trim($data['address'] ?? '');
            $landArea = (float)$data['land_area'];

            if (isFarmerIdTaken($pdo, $farmerId, $id)) {
                sendResponse(409, false, 'ID petani sudah digunakan. Gunakan ID lain.');
            }

            $stmt = $pdo->prepare(
                'UPDATE farmers
                 SET farmer_id = ?, name = ?, address = ?, land_area = ?
                 WHERE id = ?'
            );
            $stmt->execute([$farmerId, $name, $address, $landArea, $id]);

            $farmer = findFarmerById($pdo, $id);

            sendResponse(200, true, 'Data petani berhasil diperbarui.', $farmer);
            break;

        case 'DELETE':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($id <= 0) {
                sendResponse(400, false, 'Parameter id tidak valid.');
            }

            if (!findFarmerById($pdo, $id)) {
                sendResponse(404, false, 'Data petani tidak ditemukan.');
            }

            // ON DELETE CASCADE di database ikut menghapus catatan panen petani ini.
            $stmt = $pdo->prepare('DELETE FROM farmers WHERE id = ?');
            $stmt->execute([$id]);

            sendResponse(200, true, 'Data petani berhasil dihapus.');
            break;

        default:
            sendResponse(405, false, 'Metode HTTP tidak didukung.');
    }
} catch (PDOException $e) {
    // Detail teknis hanya masuk log server, tidak dikirim ke pengguna.
    error_log($e->getMessage());
    sendResponse(500, false, 'Terjadi kesalahan pada server.');
}
