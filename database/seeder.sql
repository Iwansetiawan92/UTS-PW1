USE belajar_rest_api;

START TRANSACTION;

-- Tambahkan petani. farmer_id adalah identitas unik yang digunakan pengguna.
INSERT INTO farmers (farmer_id, name, address, land_area)
VALUES
    ('P001', 'Ujang Suhendar', 'Blok A, Giri Mekar', 1.50),
    ('P002', 'Asep Saepudin', 'Blok B, Giri Mekar', 2.00),
    ('P003', 'Siti Aminah', 'Blok C, Giri Mekar', 1.25),
    ('P004', 'Dedi Kurniawan', 'Blok D, Giri Mekar', 0.75),
    ('P005', 'Rina Marlina', 'Blok E, Giri Mekar', 1.80),
    ('P006', 'Usep Rohman', 'Blok F, Giri Mekar', 2.25)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    address = VALUES(address),
    land_area = VALUES(land_area);

-- Hubungkan data panen ke ID internal petani melalui farmer_id.
-- NOT EXISTS mencegah catatan panen contoh yang sama dimasukkan berulang kali.
INSERT INTO harvests (farmer_id, harvest_date, quantity_kg)
SELECT f.id, seed.harvest_date, seed.quantity_kg
FROM (
    SELECT 'P001' AS farmer_code, '2026-10-05' AS harvest_date, 125.50 AS quantity_kg
    UNION ALL SELECT 'P001', '2026-11-05', 138.00
    UNION ALL SELECT 'P002', '2026-10-08', 172.75
    UNION ALL SELECT 'P002', '2026-11-08', 160.25
    UNION ALL SELECT 'P003', '2026-10-12', 98.50
    UNION ALL SELECT 'P003', '2026-11-12', 110.00
    UNION ALL SELECT 'P004', '2026-10-15', 72.25
    UNION ALL SELECT 'P004', '2026-11-15', 80.50
    UNION ALL SELECT 'P005', '2026-10-18', 145.00
    UNION ALL SELECT 'P005', '2026-11-18', 152.75
    UNION ALL SELECT 'P006', '2026-10-20', 190.00
    UNION ALL SELECT 'P006', '2026-11-19', 205.50
) AS seed
INNER JOIN farmers AS f
    ON f.farmer_id = seed.farmer_code
WHERE NOT EXISTS (
    SELECT 1
    FROM harvests AS h
    WHERE h.farmer_id = f.id
      AND h.harvest_date = seed.harvest_date
      AND h.quantity_kg = seed.quantity_kg
);

COMMIT;

-- Pemeriksaan hasil seeder.
SELECT id, farmer_id, name, address, land_area
FROM farmers
WHERE farmer_id IN ('P001', 'P002', 'P003', 'P004', 'P005', 'P006')
ORDER BY farmer_id;

SELECT
    h.id,
    f.farmer_id AS farmer_code,
    f.name AS farmer_name,
    h.harvest_date,
    h.quantity_kg
FROM harvests AS h
INNER JOIN farmers AS f ON f.id = h.farmer_id
WHERE f.farmer_id IN ('P001', 'P002', 'P003', 'P004', 'P005', 'P006')
ORDER BY h.harvest_date DESC, h.id DESC;
