<?php
// Konfigurasi MySQL lokal
$host = 'localhost';
$db   = 'belajar_rest_api';
$user = 'root';
$pass = '';

// DSN berisi informasi jenis database, alamat server, dan nama database.
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

// Opsi PDO mengatur cara melaporkan error dan mengambil hasil query.
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false
];

try {
    // Variabel $pdo akan digunakan oleh file API.
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Detail kesalahan disimpan di log, bukan ditampilkan ke pengguna.
    error_log($e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal. Periksa MySQL dan konfigurasi database.'
    ]);
    exit;
}
