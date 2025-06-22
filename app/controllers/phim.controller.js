const db = require("../models");
const { Op } = require("sequelize");
const Phim = db.Phim;
const TheLoai = db.TheLoai;
const TheLoaiPhim = db.TheLoaiPhim;
const PhuongTienMedia = db.PhuongTienMedia;
const errorHandler = require("../utils/errorHandler");
const fs = require("fs");
const path = require("path");

// Thêm phim
exports.createMovie = async (req, res) => {
  try {
    const { ten, moTa, thoiLuong, ngayKhoiChieu, theLoaiIds, trailers } =
      req.body;
    const posters = req.files;

    const phim = await Phim.create({ ten, moTa, thoiLuong, ngayKhoiChieu });

    if (Array.isArray(theLoaiIds) && theLoaiIds.length > 0) {
      const theLoais = await TheLoai.findAll({ where: { id: theLoaiIds } });
      await phim.setTheLoais(theLoais);
    }

    if (Array.isArray(posters) && posters.length > 0) {
      const posterRecords = posters.map((file) => ({
        phimId: phim.id,
        loai: "poster",
        duongDan: `poster/${file.filename}`,
      }));
      await PhuongTienMedia.bulkCreate(posterRecords);
    }

    if (trailers) {
      await PhuongTienMedia.create({
        phimId: phim.id,
        loai: "trailer",
        duongDan: trailers,
      });
    }

    res.status(201).json({ success: true, data: phim });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Cập nhật phim
exports.updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten, moTa, thoiLuong, ngayKhoiChieu, theLoaiIds, trailers } =
      req.body;
    const posters = req.files;

    const phim = await Phim.findByPk(id);
    if (!phim) return res.status(404).json({ message: "Phim không tồn tại" });

    await phim.update({ ten, moTa, thoiLuong, ngayKhoiChieu });

    if (Array.isArray(theLoaiIds)) {
      const theLoais = await TheLoai.findAll({ where: { id: theLoaiIds } });
      await phim.setTheLoais(theLoais);
    }

    if (trailers) {
      await PhuongTienMedia.destroy({
        where: { phimId: phim.id, loai: "trailer" },
      });

      await PhuongTienMedia.create({
        phimId: phim.id,
        loai: "trailer",
        duongDan: trailers,
      });
    }

    if (Array.isArray(posters) && posters.length > 0) {
      //tìm và xóa poster cũ trong tập poster
      const postersCu = await PhuongTienMedia.findAll({
        where: { phimId: phim.id, loai: "poster" },
      });
      postersCu.forEach((poster) => {
        const filePath = path.join(
          __dirname,
          "../uploads/posters",
          path.basename(poster.duongDan)
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      //xóa trong db
      await PhuongTienMedia.destroy({
        where: { phimId: phim.id, loai: "poster" },
      });
      const posterRecords = posters.map((file) => ({
        phimId: phim.id,
        loai: "poster",
        duongDan: `poster/${file.filename}`,
      }));
      await PhuongTienMedia.bulkCreate(posterRecords);
    }

    res.json({ success: true, data: phim });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Xóa mềm phim
exports.softDeleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const phim = await Phim.findByPk(id);
    if (!phim) return res.status(404).json({ message: "Phim không tồn tại" });

    await phim.update({
      daXoa: true,
      thoiDiemXoa: new Date(),
    });

    res.json({ success: true, message: "Đã xóa mềm phim" });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả phim chưa xóa mềm
exports.getAllMovies = async (req, res) => {
  try {
    const danhSach = await Phim.findAll({
      where: { daXoa: false },
      include: [
        { model: TheLoai, through: { attributes: [] } },
        { model: PhuongTienMedia },
      ],
    });

    res.json({ success: true, data: danhSach });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy phim theo thể loại
exports.getMoviesByGenre = async (req, res) => {
  try {
    const { theLoaiId } = req.params;

    const theLoai = await TheLoai.findByPk(theLoaiId, {
      include: {
        model: Phim,
        where: { daXoa: false },
        through: { attributes: [] },
        include: [PhuongTienMedia],
      },
    });

    if (!theLoai)
      return res.status(404).json({ message: "Không tìm thấy thể loại" });

    res.json({ success: true, data: theLoai.Phims });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Thêm thể loại
exports.createGenre = async (req, res) => {
  try {
    const { ten } = req.body;
    const theLoai = await TheLoai.create({ ten });
    res.status(201).json({ success: true, data: theLoai });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Cập nhật thể loại
exports.updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten } = req.body;

    const theLoai = await TheLoai.findByPk(id);
    if (!theLoai)
      return res.status(404).json({ message: "Không tìm thấy thể loại" });

    await theLoai.update({ ten });
    res.json({ success: true, data: theLoai });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Xóa thể loại (chỉ khi không có phim nào dùng)
exports.deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await TheLoaiPhim.count({ where: { theLoaiId: id } });

    if (count > 0)
      return res
        .status(400)
        .json({ message: "Không thể xóa vì thể loại đang được sử dụng" });

    const result = await TheLoai.destroy({ where: { id } });
    if (result === 0)
      return res.status(404).json({ message: "Thể loại không tồn tại" });

    res.json({ success: true, message: "Đã xóa thể loại thành công" });
  } catch (error) {
    errorHandler(res, error);
  }
};
