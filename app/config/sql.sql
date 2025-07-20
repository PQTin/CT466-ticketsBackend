CREATE DATABASE vePhim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vePhim;

-- Bảng người dùng
CREATE TABLE nguoiDung (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenDangNhap VARCHAR(50) UNIQUE NOT NULL,
  matKhau VARCHAR(255) NOT NULL,
  soDienThoai VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  duongDanAvatar VARCHAR(255),
  vaiTro ENUM('admin','client') DEFAULT 'client',
  trangThai ENUM('good', 'bad') DEFAULT 'good',
  taoLuc DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- tài khoản admin
INSERT INTO nguoiDung (tenDangNhap, matKhau, soDienThoai, duongDanAvatar, vaiTro, trangThai)
VALUES (
    'tin123',
    '$2b$10$OMYfQv3l3OQrTejhxALfJ.Hc/El8uF7lOEpDHDeZ0pRxVtcr5XICm',
    '0921212276',
    'tin@example.com',
    'avatars/default.png',
    'admin',
    'good'
);
-- Bảng chi nhánh rạp
CREATE TABLE chiNhanh (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten VARCHAR(255) NOT NULL,
  diaChi TEXT NOT NULL,
  soDienThoai VARCHAR(20),
  daXoa BOOLEAN DEFAULT FALSE,
  thoiDiemXoa DATETIME DEFAULT NULL

);

-- Bảng phòng chiếu
CREATE TABLE phongChieu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chiNhanhId INT NOT NULL,
  ten VARCHAR(50) NOT NULL,
  tongSoGhe INT NOT NULL,
  daXoa BOOLEAN DEFAULT FALSE,
  thoiDiemXoa DATETIME DEFAULT NULL,
  FOREIGN KEY (chiNhanhId) REFERENCES chiNhanh(id) ON DELETE CASCADE
);

-- Bảng loại ghế
CREATE TABLE loaiGhe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten VARCHAR(50) NOT NULL,
  giaPhu DECIMAL(10,2) DEFAULT 0,
  daXoa BOOLEAN DEFAULT FALSE,
  thoiDiemXoa DATETIME DEFAULT NULL
);

-- Bảng ghế
CREATE TABLE ghe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phongChieuId INT NOT NULL,
  hang CHAR(1) NOT NULL,
  cot INT NOT NULL,
  loaiGheId INT,
  UNIQUE (phongChieuId, hang, cot),
  FOREIGN KEY (phongChieuId) REFERENCES phongChieu(id) ON DELETE CASCADE,
  FOREIGN KEY (loaiGheId) REFERENCES loaiGhe(id) ON DELETE SET NULL
);

-- Bảng phim
CREATE TABLE phim (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten VARCHAR(255) NOT NULL,
  moTa TEXT,
  thoiLuong INT NOT NULL,
  ngayKhoiChieu DATE NOT NULL,
  daXoa BOOLEAN DEFAULT FALSE,
  thoiDiemXoa DATETIME DEFAULT NULL
);

-- Bảng thể loại
CREATE TABLE theLoai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten VARCHAR(50) UNIQUE NOT NULL
);

-- Bảng thể loại phim (N-N)
CREATE TABLE theLoaiPhim (
  phimId INT NOT NULL,
  theLoaiId INT NOT NULL,
  PRIMARY KEY (phimId, theLoaiId),
  FOREIGN KEY (phimId) REFERENCES phim(id) ON DELETE CASCADE,
  FOREIGN KEY (theLoaiId) REFERENCES theLoai(id) ON DELETE CASCADE
);

-- Bảng media phim
CREATE TABLE phuongTienMedia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phimId INT NOT NULL,
  loai ENUM('poster','trailer') NOT NULL,
  duongDan VARCHAR(255) NOT NULL,
  FOREIGN KEY (phimId) REFERENCES phim(id) ON DELETE CASCADE
);

-- Bảng lịch chiếu
CREATE TABLE lichChieu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phimId INT NOT NULL,
  phongChieuId INT NOT NULL,
  batDau DATETIME NOT NULL,
  ketThuc DATETIME NOT NULL,
  giaVe DECIMAL(10,2) NOT NULL DEFAULT 0,
  daXoa BOOLEAN DEFAULT FALSE,
  UNIQUE (phongChieuId, batDau),
  FOREIGN KEY (phimId) REFERENCES phim(id) ON DELETE CASCADE,
  FOREIGN KEY (phongChieuId) REFERENCES phongChieu(id) ON DELETE CASCADE
);



-- Bảng vé
CREATE TABLE ve (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nguoiDungId INT NOT NULL,
  gheId INT NOT NULL,
  lichChieuId INT NOT NULL,
  gia DECIMAL(10,2) NOT NULL,
  giaGoc DECIMAL(10,2) NOT NULL,
  maGiamGiaSuDung VARCHAR(50),
  tenLoaiGhe VARCHAR(50),
  trangThai ENUM('pending', 'unused', 'used', 'expired', 'refunded','cancelled') DEFAULT 'pending',
  daThanhToan BOOLEAN DEFAULT FALSE,
  muaLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  maQR VARCHAR(255), 

  FOREIGN KEY (nguoiDungId) REFERENCES nguoiDung(id) ON DELETE CASCADE,
  FOREIGN KEY (gheId) REFERENCES ghe(id) ON DELETE CASCADE,
  FOREIGN KEY (lichChieuId) REFERENCES lichChieu(id) ON DELETE CASCADE
);


-- Bảng combo
CREATE TABLE combo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten VARCHAR(255) NOT NULL,
  moTa TEXT,
  gia DECIMAL(10,2) NOT NULL,
  duongDanAnh VARCHAR(255),
  daXoa BOOLEAN DEFAULT FALSE,
  thoiDiemXoa DATETIME DEFAULT NULL
);

-- Bảng combo vé
CREATE TABLE comboVe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veId INT NOT NULL,
  comboId INT NOT NULL,
  gia DECIMAL(10,2) NOT NULL,
  thanhTien DECIMAL(10,2) NOT NULL,
  soLuong INT NOT NULL DEFAULT 1,
  daThanhToanCombo BOOLEAN DEFAULT FALSE,
  maGiamGiaSuDung VARCHAR(50),
  FOREIGN KEY (veId) REFERENCES ve(id) ON DELETE CASCADE,
  FOREIGN KEY (comboId) REFERENCES combo(id) ON DELETE CASCADE
);

-- Bảng đánh giá combo
CREATE TABLE danhGiaCombo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nguoiDungId INT NOT NULL,
  comboId INT NOT NULL,
  diem INT NOT NULL CHECK (diem BETWEEN 1 AND 5),
  binhLuan TEXT,
  taoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nguoiDungId) REFERENCES nguoiDung(id) ON DELETE CASCADE,
  FOREIGN KEY (comboId) REFERENCES combo(id) ON DELETE CASCADE
);

-- Bảng khuyến mãi
CREATE TABLE khuyenMai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma VARCHAR(50) UNIQUE NOT NULL,
  loaiApDung ENUM('ve', 'combo', 'all') DEFAULT 'all',
  moTa TEXT,
  phanTramGiam INT NOT NULL,
  ngayBatDau DATE NOT NULL,
  ngayKetThuc DATE NOT NULL,
  duongDanAnh VARCHAR(255),
  hoatDong BOOLEAN DEFAULT TRUE
);

-- Bảng mã giảm giá cá nhân
CREATE TABLE maGiamGia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma VARCHAR(50) UNIQUE NOT NULL,
  khuyenMaiId INT,
  nguoiDungId INT,
  daDung BOOLEAN DEFAULT FALSE,
  taoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  suDungLuc DATETIME,
  FOREIGN KEY (khuyenMaiId) REFERENCES khuyenMai(id) ON DELETE SET NULL,
  FOREIGN KEY (nguoiDungId) REFERENCES nguoiDung(id) ON DELETE CASCADE
);

-- Bảng đánh giá phim (cho phép phản hồi)
CREATE TABLE danhGiaPhim (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nguoiDungId INT NOT NULL,
  phimId INT NOT NULL,
  binhLuanChaId INT DEFAULT NULL,
  diem INT CHECK (diem IS NULL OR diem BETWEEN 1 AND 5),
  binhLuan TEXT,
  taoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nguoiDungId) REFERENCES nguoiDung(id) ON DELETE CASCADE,
  FOREIGN KEY (phimId) REFERENCES phim(id) ON DELETE CASCADE,
  FOREIGN KEY (binhLuanChaId) REFERENCES danhGiaPhim(id) ON DELETE CASCADE
);

-- Bảng thông báo cho người dùng
CREATE TABLE thongBao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nguoiDungId INT NOT NULL,
  tieuDe VARCHAR(255) NOT NULL,
  noiDung TEXT NOT NULL,
  daDoc BOOLEAN DEFAULT FALSE,
  taoLuc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nguoiDungId) REFERENCES nguoiDung(id) ON DELETE CASCADE
);



-- Thêm sự kiện cập nhật trạng thái vé
USE vePhim;

DELIMITER $$

DROP EVENT IF EXISTS capNhatTrangThaiVeHetHan $$

CREATE EVENT capNhatTrangThaiVeHetHan
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
  -- Cập nhật PENDING -> EXPIRED
INSERT INTO thongBao (nguoiDungId, tieuDe, noiDung)
SELECT DISTINCT nd.id,
       'Tài khoản của bạn đã bị khóa',
       CONCAT('Bạn đã đặt vé nhưng không thanh toán trước suất chiếu lúc ', lc.batDau, '. Tài khoản hiện bị khóa.')
FROM ve v
JOIN lichChieu lc ON v.lichChieuId = lc.id
  AND lc.ketThuc >= CURDATE()
  AND lc.ketThuc < CURDATE() + INTERVAL 1 DAY
JOIN nguoiDung nd ON v.nguoiDungId = nd.id
WHERE v.trangThai = 'pending'
  AND lc.ketThuc <= NOW()
  AND nd.trangThai = 'good'
  AND NOT EXISTS (
    SELECT 1
    FROM thongBao tb
    WHERE tb.nguoiDungId = nd.id
      AND tb.tieuDe = 'Tài khoản của bạn đã bị khóa'
      AND tb.taoLuc >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
  );
-- Cập nhật vé PENDING → EXPIRED và đồng thời khóa người dùng liên quan
UPDATE ve v
JOIN lichChieu lc ON v.lichChieuId = lc.id
    AND lc.ketThuc >= CURDATE()
    AND lc.ketThuc < CURDATE() + INTERVAL 1 DAY
JOIN nguoiDung nd ON v.nguoiDungId = nd.id
SET 
  v.trangThai = 'expired',
  nd.trangThai = 'bad'
WHERE v.trangThai = 'pending'
  AND lc.ketThuc <= NOW();

  -- UNUSED → EXPIRED
--  Lấy người dùng cần thông báo
INSERT INTO thongBao (nguoiDungId, tieuDe, noiDung)
SELECT DISTINCT nd.id,
       'Vé của bạn đã bị hủy do không sử dụng',
       CONCAT('Vé cho suất chiếu lúc ', lc.batDau, ' đã hết hạn do bạn không sử dụng.')
FROM ve v
JOIN lichChieu lc ON v.lichChieuId = lc.id
  AND lc.ketThuc >= CURDATE()
  AND lc.ketThuc < CURDATE() + INTERVAL 1 DAY
JOIN nguoiDung nd ON v.nguoiDungId = nd.id
WHERE v.trangThai = 'unused'
  AND lc.ketThuc <= NOW()
  AND NOT EXISTS (
    SELECT 1 FROM thongBao tb
    WHERE tb.nguoiDungId = nd.id
      AND tb.tieuDe = 'Vé của bạn đã bị hủy do không sử dụng'
      AND tb.taoLuc >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
  );
-- cập nhật vé
UPDATE ve v
JOIN lichChieu lc ON v.lichChieuId = lc.id
  SET v.trangThai = 'expired'
  WHERE v.trangThai = 'unused'
    AND lc.ketThuc <= NOW();
END $$
DELIMITER ;




