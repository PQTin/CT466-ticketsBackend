const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.NguoiDung = require("./nguoiDung")(sequelize, Sequelize.DataTypes);
db.ChiNhanh = require("./chiNhanh")(sequelize, Sequelize.DataTypes);
db.PhongChieu = require("./phongChieu")(sequelize, Sequelize.DataTypes);
db.LoaiGhe = require("./loaiGhe")(sequelize, Sequelize.DataTypes);
db.Ghe = require("./ghe")(sequelize, Sequelize.DataTypes);
db.Phim = require("./phim")(sequelize, Sequelize.DataTypes);
db.TheLoai = require("./theLoai")(sequelize, Sequelize.DataTypes);
db.TheLoaiPhim = require("./theLoaiPhim")(sequelize, Sequelize.DataTypes);
db.PhuongTienMedia = require("./phuongTienMedia")(
  sequelize,
  Sequelize.DataTypes
);
db.LichChieu = require("./lichChieu")(sequelize, Sequelize.DataTypes);
db.Ve = require("./ve")(sequelize, Sequelize.DataTypes);
db.Combo = require("./combo")(sequelize, Sequelize.DataTypes);
db.ComboVe = require("./comboVe")(sequelize, Sequelize.DataTypes);
db.DanhGiaCombo = require("./danhGiaCombo")(sequelize, Sequelize.DataTypes);
db.KhuyenMai = require("./khuyenMai")(sequelize, Sequelize.DataTypes);
db.MaGiamGia = require("./maGiamGia")(sequelize, Sequelize.DataTypes);
db.DanhGiaPhim = require("./danhGiaPhim")(sequelize, Sequelize.DataTypes);
db.ThongBao = require("./thongBao")(sequelize, Sequelize.DataTypes);

// ChiNhanh - PhongChieu (1-N)
db.ChiNhanh.hasMany(db.PhongChieu, { foreignKey: "chiNhanhId" });
db.PhongChieu.belongsTo(db.ChiNhanh, { foreignKey: "chiNhanhId" });

// PhongChieu - Ghe (1-N)
db.PhongChieu.hasMany(db.Ghe, { foreignKey: "phongChieuId" });
db.Ghe.belongsTo(db.PhongChieu, { foreignKey: "phongChieuId" });

// LoaiGhe - Ghe (1-N, SET NULL)
db.LoaiGhe.hasMany(db.Ghe, { foreignKey: "loaiGheId" });
db.Ghe.belongsTo(db.LoaiGhe, { foreignKey: "loaiGheId" });

// Phim - TheLoai (N-N)
db.Phim.belongsToMany(db.TheLoai, {
  through: db.TheLoaiPhim,
  foreignKey: "phimId",
});
db.TheLoai.belongsToMany(db.Phim, {
  through: db.TheLoaiPhim,
  foreignKey: "theLoaiId",
});

// Phim - PhuongTienMedia (1-N)
db.Phim.hasMany(db.PhuongTienMedia, { foreignKey: "phimId" });
db.PhuongTienMedia.belongsTo(db.Phim, { foreignKey: "phimId" });

// Phim - LichChieu (1-N)
db.Phim.hasMany(db.LichChieu, { foreignKey: "phimId" });
db.LichChieu.belongsTo(db.Phim, { foreignKey: "phimId" });

// PhongChieu - LichChieu (1-N)
db.PhongChieu.hasMany(db.LichChieu, { foreignKey: "phongChieuId" });
db.LichChieu.belongsTo(db.PhongChieu, { foreignKey: "phongChieuId" });

// NguoiDung - Ve (1-N)
db.NguoiDung.hasMany(db.Ve, { foreignKey: "nguoiDungId" });
db.Ve.belongsTo(db.NguoiDung, { foreignKey: "nguoiDungId" });

// Ghe - Ve (1-N)
db.Ghe.hasMany(db.Ve, { foreignKey: "gheId" });
db.Ve.belongsTo(db.Ghe, { foreignKey: "gheId" });

// LichChieu - Ve (1-N)
db.LichChieu.hasMany(db.Ve, { foreignKey: "lichChieuId" });
db.Ve.belongsTo(db.LichChieu, { foreignKey: "lichChieuId" });

// Ve - ComboVe (1-N)
db.Ve.hasMany(db.ComboVe, { foreignKey: "veId" });
db.ComboVe.belongsTo(db.Ve, { foreignKey: "veId" });

// Combo - ComboVe (1-N)
db.Combo.hasMany(db.ComboVe, { foreignKey: "comboId" });
db.ComboVe.belongsTo(db.Combo, { foreignKey: "comboId" });

// NguoiDung - DanhGiaCombo (1-N)
db.NguoiDung.hasMany(db.DanhGiaCombo, { foreignKey: "nguoiDungId" });
db.DanhGiaCombo.belongsTo(db.NguoiDung, { foreignKey: "nguoiDungId" });

// Combo - DanhGiaCombo (1-N)
db.Combo.hasMany(db.DanhGiaCombo, { foreignKey: "comboId" });
db.DanhGiaCombo.belongsTo(db.Combo, { foreignKey: "comboId" });

// KhuyenMai - MaGiamGia (1-N, SET NULL)
db.KhuyenMai.hasMany(db.MaGiamGia, { foreignKey: "khuyenMaiId" });
db.MaGiamGia.belongsTo(db.KhuyenMai, { foreignKey: "khuyenMaiId" });

// NguoiDung - MaGiamGia (1-N)
db.NguoiDung.hasMany(db.MaGiamGia, { foreignKey: "nguoiDungId" });
db.MaGiamGia.belongsTo(db.NguoiDung, { foreignKey: "nguoiDungId" });

// NguoiDung - DanhGiaPhim (1-N)
db.NguoiDung.hasMany(db.DanhGiaPhim, { foreignKey: "nguoiDungId" });
db.DanhGiaPhim.belongsTo(db.NguoiDung, { foreignKey: "nguoiDungId" });

// Phim - DanhGiaPhim (1-N)
db.Phim.hasMany(db.DanhGiaPhim, { foreignKey: "phimId" });
db.DanhGiaPhim.belongsTo(db.Phim, { foreignKey: "phimId" });

// DanhGiaPhim - Reply (1-N self)
db.DanhGiaPhim.hasMany(db.DanhGiaPhim, {
  foreignKey: "binhLuanChaId",
  as: "phanHoi",
});
db.DanhGiaPhim.belongsTo(db.DanhGiaPhim, {
  foreignKey: "binhLuanChaId",
  as: "binhLuanCha",
});

// NguoiDung - ThongBao (1-N)
db.NguoiDung.hasMany(db.ThongBao, { foreignKey: "nguoiDungId" });
db.ThongBao.belongsTo(db.NguoiDung, { foreignKey: "nguoiDungId" });

module.exports = db;
