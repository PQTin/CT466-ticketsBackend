const db = require("../models");
const { Op, Sequelize } = require("sequelize");
const Phim = db.Phim;
const TheLoai = db.TheLoai;
const TheLoaiPhim = db.TheLoaiPhim;
const PhuongTienMedia = db.PhuongTienMedia;
const DanhGiaPhim = db.DanhGiaPhim;
const LichChieu = db.LichChieu;
const ChiNhanh = db.ChiNhanh;
const PhongChieu = db.PhongChieu;
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

    let ids = theLoaiIds;

    // Ép về mảng nếu chỉ gửi 1 thể loại (gặp khi dùng FormData)
    if (typeof ids === "string" || typeof ids === "number") {
      ids = [ids];
    } else if (!Array.isArray(ids)) {
      ids = [];
    }

    if (ids.length > 0) {
      const theLoais = await TheLoai.findAll({ where: { id: ids } });
      await phim.setTheLoais(theLoais);
    }

    if (Array.isArray(posters) && posters.length > 0) {
      const posterRecords = posters.map((file) => ({
        phimId: phim.id,
        loai: "poster",
        duongDan: `posters/${file.filename}`,
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

    let ids = theLoaiIds;

    // Ép về mảng nếu chỉ gửi 1 thể loại (gặp khi dùng FormData)
    if (typeof ids === "string" || typeof ids === "number") {
      ids = [ids];
    } else if (!Array.isArray(ids)) {
      ids = [];
    }

    if (ids.length > 0) {
      const theLoais = await TheLoai.findAll({ where: { id: ids } });
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
        duongDan: `posters/${file.filename}`,
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

    // Lấy điểm trung bình và số đánh giá cho mỗi phim
    const danhGia = await DanhGiaPhim.findAll({
      where: { binhLuanChaId: null },
      attributes: [
        "phimId",
        [Sequelize.fn("AVG", Sequelize.col("diem")), "diemTrungBinh"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "soDanhGia"],
      ],
      group: ["phimId"],
    });

    const diemMap = {};
    danhGia.forEach((dg) => {
      diemMap[dg.phimId] = {
        diemTrungBinh: parseFloat(dg.get("diemTrungBinh")).toFixed(1),
        soDanhGia: parseInt(dg.get("soDanhGia")),
      };
    });

    // Gắn điểm vào phim
    const danhSachCoDiem = danhSach.map((phim) => {
      const diem = diemMap[phim.id] || { diemTrungBinh: "5.0", soDanhGia: 0 };
      return {
        ...phim.toJSON(),
        diemTrungBinh: diem.diemTrungBinh,
        soDanhGia: diem.soDanhGia,
      };
    });

    res.json({ success: true, data: danhSachCoDiem });
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

    const phimIds = theLoai.Phims.map((p) => p.id);

    const danhGia = await DanhGiaPhim.findAll({
      where: {
        binhLuanChaId: null,
        phimId: phimIds,
      },
      attributes: [
        "phimId",
        [Sequelize.fn("AVG", Sequelize.col("diem")), "diemTrungBinh"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "soDanhGia"],
      ],
      group: ["phimId"],
    });

    const diemMap = {};
    danhGia.forEach((dg) => {
      diemMap[dg.phimId] = {
        diemTrungBinh: parseFloat(dg.get("diemTrungBinh")).toFixed(1),
        soDanhGia: parseInt(dg.get("soDanhGia")),
      };
    });

    const danhSachCoDiem = theLoai.Phims.map((phim) => {
      const diem = diemMap[phim.id] || { diemTrungBinh: "5.0", soDanhGia: 0 };
      return {
        ...phim.toJSON(),
        diemTrungBinh: diem.diemTrungBinh,
        soDanhGia: diem.soDanhGia,
      };
    });

    res.json({ success: true, data: danhSachCoDiem });
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
// Lấy tất cả thể loại
exports.getAllGenres = async (req, res) => {
  try {
    const danhSach = await TheLoai.findAll({
      order: [["ten", "ASC"]],
    });
    res.json({ success: true, data: danhSach });
  } catch (err) {
    errorHandler(res, err);
  }
};

// Lấy phim theo idPhim
exports.getMovieById = async (req, res) => {
  const { id } = req.params;

  try {
    const phim = await Phim.findOne({
      where: {
        id,
        daXoa: false,
      },
      attributes: ["id", "ten", "moTa", "thoiLuong", "ngayKhoiChieu"],
      include: [
        {
          model: TheLoai,
          through: { attributes: [] },
          attributes: ["ten"],
        },
        {
          model: PhuongTienMedia,
          attributes: ["id", "loai", "duongDan"],
        },
      ],
    });

    if (!phim) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phim" });
    }

    // Lấy trailer và poster từ media
    const trailer = phim.PhuongTienMedia.find((m) => m.loai === "trailer");
    const posters = phim.PhuongTienMedia.filter((m) => m.loai === "poster");

    const response = {
      id: phim.id,
      ten: phim.ten,
      moTa: phim.moTa,
      thoiLuong: phim.thoiLuong,
      ngayKhoiChieu: phim.ngayKhoiChieu,
      theLoai: phim.TheLoais.map((tl) => tl.ten),
      trailer: trailer ? trailer.duongDan : null,
      posters: posters.map((p) => p.duongDan),
    };

    return res.json({ success: true, data: response });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy danh sách bình luận (và phản hồi) theo phimId
exports.getCommentsByMovieId = async (req, res) => {
  const { id } = req.params;

  try {
    const binhLuans = await DanhGiaPhim.findAll({
      where: {
        phimId: id,
        binhLuanChaId: null,
      },
      order: [["taoLuc", "DESC"]],
      attributes: ["id", "binhLuan", "diem", "taoLuc"],
      include: [
        {
          model: db.NguoiDung,
          attributes: ["id", "tenDangNhap", "duongDanAvatar"],
        },
        {
          model: DanhGiaPhim,
          as: "phanHoi",
          attributes: ["id", "binhLuan", "diem", "taoLuc"],
          include: [
            {
              model: db.NguoiDung,
              attributes: ["id", "tenDangNhap", "duongDanAvatar"],
            },
          ],
          order: [["taoLuc", "DESC"]],
        },
      ],
    });
    // Tính điểm trung bình
    const diemHopLe = binhLuans.filter(
      (b) => b.diem !== null && b.diem !== undefined
    );
    const totalRatings = diemHopLe.length;
    const avgScore =
      totalRatings > 0
        ? diemHopLe.reduce((sum, b) => sum + b.diem, 0) / totalRatings
        : 0;

    res.json({
      success: true,
      data: binhLuans,
      avgScore: parseFloat(avgScore.toFixed(1)),
      totalRatings,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Người dùng đánh giá phim hoặc phản hồi
exports.rateMovie = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const { phimId, binhLuanChaId, diem, binhLuan } = req.body;

    let finalPhimId = phimId;
    let finalDiem = diem;

    if (binhLuanChaId) {
      const cha = await DanhGiaPhim.findByPk(binhLuanChaId);
      if (!cha) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy đánh giá cha." });
      }
      finalPhimId = cha.phimId;
      finalDiem = null; // Phản hồi thì không cần điểm
    } else {
      if (!phimId || typeof diem !== "number") {
        return res.status(400).json({
          success: false,
          message: "Thiếu phimId hoặc điểm đánh giá.",
        });
      }
    }

    const danhGia = await DanhGiaPhim.create({
      nguoiDungId,
      phimId: finalPhimId,
      binhLuanChaId: binhLuanChaId || null,
      diem: finalDiem,
      binhLuan,
    });

    res.json({ success: true, data: danhGia });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.getShowtimesByMovieId = async (req, res) => {
  const { id } = req.params;
  const now = new Date();

  try {
    const showtimes = await LichChieu.findAll({
      where: {
        phimId: id,
        daXoa: false,
      },
      include: [
        {
          model: PhongChieu,
          attributes: ["ten"],
          include: [{ model: ChiNhanh, attributes: ["ten"] }],
        },
      ],
      order: [["batDau", "ASC"]],
    });

    const result = showtimes
      .filter((sc) => {
        const ketThuc = new Date(sc.ketThuc);
        return now <= ketThuc; // Chỉ lấy suất còn hiệu lực (chưa kết thúc)
      })
      .map((sc) => {
        const batDau = new Date(sc.batDau);
        const ketThuc = new Date(sc.ketThuc);
        let trangThai = "";

        if (now >= batDau && now <= ketThuc) {
          trangThai = "Đang chiếu";
        } else if (now < batDau) {
          trangThai = "Sắp chiếu";
        }

        return {
          id: sc.id,
          chiNhanh: sc.PhongChieu?.ChiNhanh?.ten || "Không rõ",
          phong: sc.PhongChieu?.ten || "Không rõ",
          batDauLuc: sc.batDau,
          trangThai,
        };
      });

    res.json({ success: true, data: result });
  } catch (err) {
    errorHandler(res, err);
  }
};
