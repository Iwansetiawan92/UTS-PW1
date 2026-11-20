-- Database: belajar_rest_api
-- Charset utf8mb4 dipakai agar nama berisi karakter Unicode tersimpan dengan benar.
CREATE DATABASE IF NOT EXISTS belajar_rest_api
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE belajar_rest_api;

-- Tabel farmers menyimpan data petani.
-- farmer_id adalah ID/NIK yang diketik pengguna dan harus unik.
CREATE TABLE IF NOT EXISTS farmers (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    farmer_id   VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    address     VARCHAR(255) NULL,
    land_area   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_farmers_farmer_id (farmer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel harvests menyimpan catatan panen milik satu petani.
-- Relasi one-to-many: satu petani dapat memiliki banyak catatan panen.
-- ON DELETE CASCADE: jika petani dihapus, catatan panennya ikut dihapus
-- karena panen tidak bermakna tanpa pemiliknya.
CREATE TABLE IF NOT EXISTS harvests (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    farmer_id     INT UNSIGNED NOT NULL,
    harvest_date  DATE NOT NULL,
    quantity_kg   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_harvests_farmer_id (farmer_id),
    CONSTRAINT fk_harvests_farmer
        FOREIGN KEY (farmer_id) REFERENCES farmers (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
